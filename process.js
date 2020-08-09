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
    process -f ./otherSprites/test.json -d ./sprites -o ./output
    process -d ./sprites -o ./output
    `);
    process.exit(0);
};

function fatal(message) {
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
            app: "platformer-assets-process-1.0",
            origin: json.meta.app,
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
                } else fatal(`Unreachable`);
            }
        }
    }

    const files = [...fileSet.values()];
    if (!(files.length > 0)) {
        fatal(`No files provided`);
    }
    for (const file of files) {
        if (!fs.existsSync(file)) fatal(`File "${file}" does not exist`);
        if (fs.statSync(file).isDirectory())
            fatal(`File "${file}" is a directory`);
        if (path.extname(file) !== ".json")
            fatal(`File "${file}" is not a .json file!`);
    }
    if (!output) {
        fatal(`No output directory provided`);
    }
    if (!fs.statSync(output).isDirectory()) {
        fatal(`Output destination "${output}" is not a directory`);
    }

    for (const file of files) {
        await processFile(file, output);
    }
}
main(process.argv.slice(2));
