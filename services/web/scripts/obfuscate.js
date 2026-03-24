const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCE_VIEWS = path.join(__dirname, '../views');
const SOURCE_PUBLIC = path.join(__dirname, '../public');
const DIST_VIEWS = path.join(__dirname, '../dist/views');
const DIST_PUBLIC = path.join(__dirname, '../dist/public');
const MAP_FILE = path.join(__dirname, '../dist/classMap.json');

// Ensure directories exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Recursively copy files and return list of copied files
function processDirectory(src, dest, extsToProcess, filesList = []) {
    ensureDir(dest);
    const items = fs.readdirSync(src);
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            processDirectory(srcPath, destPath, extsToProcess, filesList);
        } else {
            // Copy file first
            fs.copyFileSync(srcPath, destPath);
            const ext = path.extname(srcPath);
            if (extsToProcess.includes(ext)) {
                filesList.push(destPath);
            }
        }
    }
    return filesList;
}

// Generate random class name
function generateClassName() {
    return 'x' + crypto.randomBytes(4).toString('hex');
}

function obfuscate() {
    console.log('Starting DOM obfuscation...');

    // 1. Clean dist or create it
    const distPath = path.join(__dirname, '../dist');
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
    }
    ensureDir(distPath);

    // 2. Copy files
    const ejsFiles = processDirectory(SOURCE_VIEWS, DIST_VIEWS, ['.ejs']);
    const cssJsFiles = processDirectory(SOURCE_PUBLIC, DIST_PUBLIC, ['.css', '.js']);

    // 3. Extract CSS classes from all CSS files
    const classMap = {};
    const cssFiles = cssJsFiles.filter(f => f.endsWith('.css'));

    for (const cssFile of cssFiles) {
        const content = fs.readFileSync(cssFile, 'utf8');
        // Match .classname { or .classname:hover or .classname, etc
        // Avoid matching decimal numbers like .5
        // We capture any characters valid in CSS class names
        const regex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const className = match[1];
            if (!classMap[className]) {
                classMap[className] = generateClassName();
            }
        }
    }

    // 4. Save map for debugging
    fs.writeFileSync(MAP_FILE, JSON.stringify(classMap, null, 2));
    console.log(`Generated ${Object.keys(classMap).length} obfuscated classes.`);

    // 5. Replace classes in CSS, JS, and HTML (EJS)
    const allFilesToProcess = [...ejsFiles, ...cssJsFiles];

    // Sort class names by length descending to prevent partial replacements
    const sortedClasses = Object.keys(classMap).sort((a, b) => b.length - a.length);

    for (const file of allFilesToProcess) {
        let content = fs.readFileSync(file, 'utf8');
        const isCss = file.endsWith('.css');
        const isJs = file.endsWith('.js');
        const isEjs = file.endsWith('.ejs');

        for (const cls of sortedClasses) {
            const obfuscated = classMap[cls];

            if (isCss) {
                // In CSS, replace exactly .className avoiding partial matches
                const cssRegex = new RegExp(`\\.${cls}(?![a-zA-Z0-9_-])`, 'g');
                content = content.replace(cssRegex, `.${obfuscated}`);
            } else if (isEjs || isJs) {
                // In HTML (EJS) and JS string HTML (innerHTML="<div class="...">")
                // Parse class="..." attributes
                const classAttrRegex = /class=["']([^"']*)["']/g;
                content = content.replace(classAttrRegex, (match, classList) => {
                    const quote = match.includes('"') ? '"' : "'";
                    const classes = classList.split(/\s+/);
                    const replaced = classes.map(c => c === cls ? obfuscated : c);
                    return `class=${quote}${replaced.join(' ')}${quote}`;
                });

                // In JS: DOM API calls (classList.add/remove/toggle/contains)
                const classListRegex = new RegExp(`\\.classList\\.(add|remove|toggle|contains)\\(\\s*(['"\`])${cls}\\2`, 'g');
                content = content.replace(classListRegex, `.classList.$1($2${obfuscated}$2`);

                // In JS: querySelector/querySelectorAll/closest
                const querySelectorRegex = new RegExp(`\\.(querySelector|querySelectorAll|closest)\\(\\s*(['"\`])\\.${cls}\\2`, 'g');
                content = content.replace(querySelectorRegex, `.$1($2.${obfuscated}$2`);

                const getElementsRegex = new RegExp(`\\.getElementsByClassName\\(\\s*(['"\`])${cls}\\2`, 'g');
                content = content.replace(getElementsRegex, `.getElementsByClassName($1${obfuscated}$1`);
            }
        }

        fs.writeFileSync(file, content);
    }
    console.log('Obfuscation complete!');
}

obfuscate();
