const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const usage = () => {
    console.log(`
Usage: process [--files | -f] [--dir | -d] [--output | -o] [--help | -h]

Options: 
    files: A list of files to process
    dir: A directory to process
    output: Output directory for processed files
    help: Display this message

Examples: 
    process --files ./sprites/test.json --output ./output
    process --dir ./sprites --output ./output
    process -d ./sprites -o ./output
    `);
    process.exit(0);
};

function error(message) {
    console.error(`
${message}

Please execute ".\\run --help" for more details.
`);
    process.exit(1);
}

let canvas = null;
let ctx = null;
async function loadImageAsBase64(file) {
    if (!canvas) canvas = createCanvas(1, 1);
    if (!ctx) ctx = canvas.getContext("2d");

    const img = await loadImage(file);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL();
}

const WHITESPACE_RX = /\w+/g;

const json = {
    sprites: {
        cat: {
            animations: {
                static: [
                    {
                        pos: { x: 0, y: 0 },
                        extents: { w: 60, h: 45 },
                        delay: 100,
                    },
                ],
                test: [
                    {
                        pos: { x: 0, y: 0 },
                        extents: { w: 60, h: 45 },
                        delay: 1000,
                    },
                    {
                        pos: { x: 120, y: 0 },
                        extents: { w: 60, h: 45 },
                        delay: 100,
                    },
                    {
                        pos: { x: 0, y: 45 },
                        extents: { w: 60, h: 45 },
                        delay: 100,
                    },
                    {
                        pos: { x: 60, y: 45 },
                        extents: { w: 60, h: 45 },
                        delay: 1000,
                    },
                ],
            },
        },
        "cat-rotated": {
            animations: {
                static: [
                    {
                        pos: { x: 60, y: 0 },
                        extents: { w: 60, h: 45 },
                        delay: 100,
                    },
                ],
            },
        },
    },
    spritesheet:
        "data:image/png;base64,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",
    meta: { app: "http://www.aseprite.org/", version: "1.2.21-dev" },
};

async function processFile(file, output) {
    const json = JSON.parse(fs.readFileSync(file, { encoding: "ascii" }));
    console.log(json.length);

    const sprites = {};
    for (const layer of json.meta.layers) {
        sprites[layer.name] = {};
        const animationKeys = json.meta.frameTags.values();
        nextAnimation: for (const animation of animationKeys) {
            const length = animation.to - animation.from + 1;
            const frames = [];
            for (let i = 0; i < length; ++i) {
                const frameName = `${layer.name} ${animation.name} ${i}`;
                const frame = json.frames[frameName];
                if (!frame) continue nextAnimation;
                frames.push({
                    uv: frame.frame,
                    delay: frame.duration,
                });
            }
            sprites[layer.name][animation.name] = {
                frames,
                direction: animation.direction,
            };
        }
    }
    let spritesheet = await loadImageAsBase64(
        `${path.dirname(file)}\\${json.meta.image}`
    );
    const transformed = {
        sprites,
        spritesheet,
        meta: {
            app: json.meta.app,
            version: json.meta.version,
        },
    };

    fs.writeFileSync(
        `${path.join(output, path.basename(file, path.extname(file)))}.json`,
        JSON.stringify(transformed)
    );
}

function getJsonFiles(dir, files_) {
    files_ = files_ || [];
    let files = fs.readdirSync(dir);
    for (const file of files) {
        if (path.extname(file) !== ".json") continue;
        console.log(path.join(dir, file));
        var name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getJsonFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

async function main(args) {
    if (!(args.length > 0)) {
        usage();
    }

    let fileSet = new Set();
    let output = null;

    let parsing = null;
    for (const arg of args) {
        switch (arg) {
            case "--files":
            case "-f": {
                parsing = "files";
                break;
            }
            case "--dir":
            case "-d": {
                parsing = "dir";
                break;
            }
            case "--output":
            case "-o": {
                parsing = "output";
                break;
            }
            case "--help":
            case "-h":
                usage();
            default: {
                // now it's a value
                if (parsing === "files") {
                    fileSet.add(arg);
                } else if (parsing === "dir") {
                    getJsonFiles(arg).forEach(fileSet.add, fileSet);
                } else if (parsing === "output") {
                    output = arg;
                } else error(`Unreachable`);
            }
        }
    }

    const files = [...fileSet.values()];
    if (!(files.length > 0)) {
        error(`No files provided`);
    }
    for (const file of files) {
        if (!fs.existsSync(file)) error(`File "${file}" does not exist`);
        if (fs.statSync(file).isDirectory())
            error(`File "${file}" is a directory`);
        if (path.extname(file) !== ".json")
            error(`File "${file}" is not a .json file!`);
    }
    if (!output) {
        error(`No output directory provided`);
    }
    if (!fs.statSync(output).isDirectory()) {
        error(`Output destination "${output}" is not a directory`);
    }

    console.log(`files: `, files);
    console.log(`output: `, output);

    for (const file of files) {
        await processFile(file, output);
    }
}
main(process.argv.slice(2));
