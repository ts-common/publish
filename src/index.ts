import * as fs from "fs"
import * as path from "path"
import * as child_process from "child_process"

const traverse = (dir: string) => {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
        const filePath = path.join(dir, file.name)
        if (file.isDirectory()) {
            traverse(filePath)
        } else if (path.extname(file.name) === ".tgz") {
            console.log(`publishing ${filePath}`)
            child_process.execSync(`npm publish ${filePath} --access=public`)
        }
    }
}

traverse("./")
