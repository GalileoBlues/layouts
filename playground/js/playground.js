import {prepareKey, analyze} from "./interact.mjs";

const keys = Array.from(document.querySelectorAll(".k"));
let languageData;
let excludedKeys = new Set();
setLanguageData("english", false);

function getKeyIndex(event) {
    let tileWidth = document.documentElement.clientWidth / 27.5;	//view width / tile count * 100
    let tileHeight = document.documentElement.clientWidth / 37.5;	//8 / 3 * 100
    let posX = Math.floor((event.x - keyboard.offsetLeft + window.scrollX) / tileWidth);
    let posY = Math.floor((event.y - keyboard.offsetTop + window.scrollY) / tileHeight);
    return (posX < 5 ? posX : posX - 1) + (posY < 5 ? posY : posY - 1) * 10;
}

function _setLanguageData(data, repaintBetterOrWorse) {
    let back = {};
    try {
        for (let k in languageData.convert) {
            back[languageData.convert[k]] = k;
        }
    } catch (e) {
        if (e.name !== "TypeError") {
            console.log("converting back failed because", e);
        }
    }

    for (let key of keys) {
        key.innerText = back[key.innerText] || key.innerText;
        key.innerText = data.convert[key.innerText] || key.innerText;
    }
    languageData = data;
    analyze(excludedKeys, languageData, repaintBetterOrWorse, true);
}

function setLanguageData(language, repaintBetterOrWorse) {
    fetch(`data/${language}.json`)
        .then((res) => res.json())
        .then(
            (json) => {
                _setLanguageData(json, repaintBetterOrWorse);
            },
            () => console.log("getting lanugage data failed :/")
        );
}

let startIndex;
window.onload = () => {
    let languageElem = document.getElementById("languages");
    for (let language of ["Albanian", "Dutch", "German", "Toki Pona"]) {
        let x = new Option(language, language.toLowerCase().replace(" ", "_"));
        languageElem.append(x);
    }

    languageElem.addEventListener("change", (c) => {
        const language = c.target.value;
        setLanguageData(language, true);
    });

    document.addEventListener("dragover", (event) => {
        event.preventDefault();
    }, false);

    keys.forEach(key => {
        key.oncontextmenu = () => {
            if (key.classList.contains("excluded-key")) {
                key.classList.remove("excluded-key");
                excludedKeys.delete(key.innerHTML);
            } else {
                key.classList.add("excluded-key");
                excludedKeys.add(key.innerHTML);
            }
            analyze(excludedKeys, languageData, true, false);
            return false;
        }

        key.addEventListener('dragstart', (event) => {
            key.classList.add('dragging');
            startIndex = getKeyIndex(event);
        })

        key.addEventListener('drop', (event) => {
            let endIndex = getKeyIndex(event);
            let startKey = '';
            try {
                startKey = keys[startIndex].innerHTML;
                keys[startIndex].innerHTML = keys[endIndex].innerHTML;
                keys[endIndex].innerHTML = startKey;

                if (keys[startIndex].classList.contains("excluded-key")) {
                    keys[endIndex].classList.add("excluded-key");
                    keys[startIndex].classList.remove("excluded-key");
                }
                else if (keys[endIndex].classList.contains("excluded-key")) {
                    keys[startIndex].classList.add("excluded-key");
                    keys[endIndex].classList.remove("excluded-key");
                }

                prepareKey(languageData["characters"], keys[startIndex]);
                prepareKey(languageData["characters"], keys[endIndex]);
            } catch {
                console.log("something is not going right lol");
            }
        })

        key.addEventListener('dragend', () => {
            key.classList.remove('dragging');
            analyze(excludedKeys, languageData, true, false);
        })
    })
}