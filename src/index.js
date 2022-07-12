import "./index.css";
// https://caludio.medium.com/how-to-download-large-files-from-github-4863a2dbba3b
const getData = async (name, key) => {
    const res = await fetch(
        `https://api.github.com/repos/AlexFradle/Life/contents/${name}.md`, {
            method: "GET",
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": `token ${key}`
            },
        }
    );
    const json = await res.json();
    const sha = json.sha;
    const res2 = await fetch(
        `https://api.github.com/repos/AlexFradle/Life/git/blobs/${sha}`, {
            method: "GET",
            headers: {
                "Accept": "application/vnd.github.v3.raw+json",
                "Authorization": `token ${key}`
            },
        }
    );
    const t = await res2.text();
    console.log(t.split("\n"));
    parseNote(t);
}

class Node {
    constructor(parent, type, element) {
        this.parent = parent;
        this.type = type;
        this.element = element;
        parent?.element.appendChild(this.element);
        console.log(this);
    }
}

const parseNote = (text) => {
    const lines = text.split("\n");
    const textArea = document.getElementById("text-area");
    textArea.innerHTML = "";
    const rootNode = new Node(null, "root", textArea);
    let curNode;
    for (let line of lines) {
        // inline code
        line = line.replace(/`([^`\n]+?)`/, (_, substr) => {
            console.log(substr);
            return `<code>${substr}</code>`;
        });
        // heading
        if (line.startsWith("#")) {
            const size = line.split(" ")[0].length;
            if (size > 6) continue;
            const elem = document.createElement(`h${size}`)
            elem.innerHTML = line.slice(size + 1);
            curNode = new Node(rootNode, "heading", elem);
            continue;
        // hr
        } else if (line === "***") {
            const elem = document.createElement("hr");
            curNode = new Node(rootNode, "divider", elem);
            continue;
        // code block
        } else if (line.startsWith("```")) {
            if (curNode?.parent.type !== "code") {
                const elem = document.createElement("div");
                elem.classList.add("code-block");
                curNode = new Node(rootNode, "code", elem);
            } else {
                curNode = rootNode;
            }
            continue;
        // lvl 1 ul
        } else if (line.startsWith("-")) {
            const li = document.createElement("li");
            li.innerHTML = line.slice(2);
            if (curNode?.parent?.type !== "ul") {
                const ul = document.createElement("ul");
                const parent = new Node(rootNode, "ul", ul);
                curNode = new Node(parent, "li", li);
            } else {
                curNode = new Node(curNode.parent, "li", li);
            }
            continue;
        }

        let parent;
        switch (curNode.type) {
            case "text":
                if (curNode?.parent?.type === "code") {
                    parent = curNode.parent;
                } else {
                    parent = rootNode;
                }
                break;
            case "heading":
            case "divider":
            case "li":
                parent = rootNode;
                break;
            default:
                parent = curNode;
                break;
        }
        const elem = document.createElement("p");
        elem.innerHTML = line;
        curNode = new Node(parent, "text", elem);
    }
}

document.getElementById("submit-button").onclick = () => {
    const name = document.getElementById("name-input").value;
    const key = document.getElementById("key-input").value;
    getData(name, key);
}
