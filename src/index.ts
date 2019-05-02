import * as fs from "fs"
import * as path from "path"
import * as child_process from "child_process"
import decompress from "decompress"

interface Package {
    readonly name: string
    readonly version: string
    readonly autoPublish?: boolean
}

type Action = "publish"|"unpublish"

const traverse = async (dir: string, action: Action, auto: boolean): Promise<void> => {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
        const filePath = path.join(dir, file.name)
        if (file.isDirectory()) {
            traverse(filePath, action, auto)
        } else if (path.extname(file.name) === ".tgz") {
            const files = await decompress(
                filePath,
                {
                    filter: file => file.path === "package/package.json"
                }
            )
            const packageJson = files[0]
            const { name, version, autoPublish } = JSON.parse(packageJson.data.toString()) as Package
            const id = `${name}@${version}`

            if (auto && autoPublish === true) {
                console.log(`skipping ${id} because autoPublish property is set to true`)
                continue;
            }

            let viewNames: string = ""
            try {
                viewNames = child_process.execSync(`npm view ${id} name`).toString()
            } catch (e) {
                console.error(`"npm view ${id} name" is failed`)
            }
            const exist = viewNames != ""
            if (action == "publish") {
                if (!exist) {
                    const fullPath = path.resolve(filePath)
                    console.log(`publishing ${id} from ${fullPath}`)
                    const cmd = `npm publish "${fullPath}" --access=public`
                    console.log(`running: ${cmd}`)
                    try {
                        console.log(`WHATIF: ${cmd}`)
                        // child_process.execSync(cmd)
                        console.log(`${id} done.`)
                    } catch (e) {
                        process.exitCode = 1
                        console.error(`${id} failed.`)
                    }
                } else {
                    console.log(`${id} from ${filePath} is skipped`)
                }
            } else {
                if (exist) {
                    console.log(`unpublishing ${id} from ${filePath}`)
                    try {
                        console.log(`WHATIF: npm unpublish ${id}`)
                        // child_process.execSync(`npm unpublish ${id}`)
                    } catch (e) {
                        process.exitCode = 1
                    }
                } else {
                    console.log(`${id} from ${filePath} is skipped`)
                }
            }
        }
    }
}

// console.log("@ts-common/publish is started")
// const cwd = path.resolve("./")
// console.log(`current folder: ${cwd}`)
const action = process.argv.indexOf("unpublish") >= 0 ? "unpublish" : "publish"
const autoPublish = process.argv.indexOf("auto") >= 0
traverse("..", action, autoPublish)
// console.log("@ts-common/publish is done")
