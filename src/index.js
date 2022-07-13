import "./index.css";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
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
    if (!res.ok) {
        return [false, json.message];
    }
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
//     console.log(t.split("\n"));
    parseNote(t);
    return [true, "complete"];
}
window.getData = getData;

class Node {
    constructor(parent, type, element, data = null) {
        this.parent = parent;
        this.type = type;
        this.element = element;
        this.data = data;
        parent?.element.appendChild(this.element);
    }
}

let SHOW_YAML = false;
const parseNote = (text) => {
    const lines = text.split("\n");
    const textArea = document.getElementById("text-area");
    textArea.innerHTML = "";
    const rootNode = new Node(null, "root", textArea);
    let curNode;
    for (let line of lines) {
        // inline code
        if (curNode?.type !== "code") {
            line = line.replace(/`([^`\n]+?)`/g, (_, substr) => {
                return `<code>${substr}</code>`;
            });
            line = line.replace(/->/g, '<span class="arrow">-></span>');
            line = line.replace(/\[\[([^\[\]]+)\]\]/g, (_, substr) => {
                const key = document.getElementById("key-input").value;
                return `<span class="link" onclick="window.getData('${substr}','${key}')">${substr}</span>`;
            });
        } else {
            // tabs to 4 spaces
            line = line.replace(/\t/g, "    ");
        }
        // yaml begin and end
        if (line.startsWith("---") && curNode?.type !== "code") {
            if (curNode?.type !== "yaml" && curNode?.type !== "yaml_row") {
                const elem = document.createElement("div");
                !SHOW_YAML && elem.classList.add("hide");
                curNode = new Node(rootNode, "yaml", elem);
            } else {
                curNode = rootNode;
            }
            continue;
        } else if (curNode?.type === "yaml" || curNode?.type === "yaml_row") {
            const elem = document.createElement("div");
            elem.innerHTML = line;
            curNode = new Node(
                curNode?.type === "yaml" ? curNode : curNode.parent,
                "yaml_row",
                elem
            );
            continue;
        // heading
        }else if (line.startsWith("#") && curNode?.type !== "code") {
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
            if (curNode?.type !== "code") {
                const elem = document.createElement("pre");
                elem.classList.add("code-block");
                elem.classList.add(`language-${line.slice(3)}`);
                curNode = new Node(rootNode, "code", elem);
            } else {
                curNode = rootNode;
            }
            continue;
        // ul
        } else if (curNode?.type !== "code" && (line.startsWith("-") || line.startsWith("\t"))) {
            const depth = line.match(/\t+-/)?.[0].indexOf("-") ?? 0;
            const li = document.createElement("li");
            li.innerHTML = line.slice(2 + depth);
            if (curNode?.parent?.type !== "ul") {
                // new list
                const ul = document.createElement("ul");
                const parent = new Node(rootNode, "ul", ul);
                curNode = new Node(parent, "li", li, {depth});
            } else if (curNode?.parent?.type === "ul") {
                // add to existing list
                if (curNode?.data?.depth < depth) {
                    const ul = document.createElement("ul");
                    const parent = new Node(curNode.parent, "ul", ul);
                    curNode = new Node(parent, "li", li, {depth});
                } else if (curNode?.data?.depth > depth) {
                    curNode = new Node(curNode.parent.parent, "li", li, {depth});
                } else {
                    curNode = new Node(curNode.parent, "li", li, {depth});
                }
            }
            continue;
        }

        let parent;
        switch (curNode.type) {
            case "code":
                curNode.element.textContent += line + "\n";
                continue;
            case "heading":
            case "divider":
            case "li":
            case "text":
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
    document.querySelectorAll('.code-block').forEach((el) => {
        hljs.highlightElement(el);
    });
}

const submitInputs = async () => {
    const name = document.getElementById("name-input").value;
    const key = document.getElementById("key-input").value;
    const status = await getData(name, key);
    const sl = document.getElementById("status-line");
    const st = document.getElementById("status-text");
    sl.removeAttribute("class");
    sl.classList.add(status[0] ? "complete" : "failed");
    st.innerText = status[1];
}

document.getElementById("submit-button").onclick = submitInputs;

document.getElementById("name-input").onkeydown = (e) => {
    if (e.keyCode === 13) submitInputs();
}

document.getElementById("key-input").onkeydown = (e) => {
    if (e.keyCode === 13) submitInputs();
}
