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
    document.getElementById("text-area").innerText = t;
}

document.getElementById("submit-button").onclick = () => {
    const name = document.getElementById("name-input").value;
    const key = document.getElementById("key-input").value;
    getData(name, key);
}
