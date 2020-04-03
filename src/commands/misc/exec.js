const { create } = require("axios");
const Command = require("../../core/Command");
const Colors = require("../../enums/Colors");

const axios = create({
    baseURL: "https://code.labstack.com/api/v1/",
    timeout: 7000
});

const ANNOYING_ERR = "/usr/bin/env: 'bash': No such file or directory\n";

module.exports = new Command({
    name: "exec",
    async run(language, content, channel) {
        // Patch to the api's error
        let data;
        for (let j = 0; j < 5; j++) {
            data = (
                await axios.post("/run", {
                    content,
                    language
                })
            ).data;
            if (data.stderr != ANNOYING_ERR) break;
        }

        //split message by length
        const output = data.exit_code ? data.stderr : data.stdout;
        const chunks = Math.ceil(output.length / 2042);
        const color = data.exit_code ? Colors.ERROR : Colors.SUCCESS;
        for (let i = 0; i < chunks; i++) {
            let footer, title;
            if (i == 0 && data.exit_code) {
                title = "Error";
            }
            if (i == chunks - 1) {
                footer = {};
                footer.text = data.exit_code
                    ? `Process finished in ${data.execution_time /
                          1000000}s with exit code ${data.exit_code}`
                    : `Code successfully executed in ${data.execution_time /
                          1000000}s.`;
                footer.text += `\ncode.labstack.com`;
            }
            channel.send({
                embed: {
                    color,
                    title,
                    footer,
                    description:
                        "```\n" +
                        output.slice(i * 2042, (i + 1) * 2042 - 1) +
                        "```"
                }
            });
        }
    },
    async init() {
        //fetch language list
        this.languageList = (await axios.get("/languages")).data;
        this.languages = this.languageList.reduce((languages, language) => {
            languages[language.id] = language.id;
            return languages;
        }, {});

        //alternatives
        this.languages.js = this.languages.javascript;
        this.languages.py = this.languages.python;
        this.languages.cs = this.languages.csharp;
        this.languages["c++"] = this.languages.cpp;

        //register subcommands
        for (const [language, id] of Object.entries(this.languages)) {
            this.subcommand({
                name: language,

                async execute(parameters) {
                    const match = parameters.command.content.match(
                        /^(```|`)([a-zA-Z+-]*\n+)?(.*)\1/s
                    );
                    if (!match) {
                        throw new Error(
                            `Invalid syntax for subcommand ${parameters.command.name} of command ${parameters.command.super.name}`
                        );
                    }

                    let [, delimiter, syntax, code] = match;
                    if (delimiter == "`" && syntax) {
                        code = syntax + code;
                    }

                    await this.run({ id }, code, parameters.message.channel);
                }
            });
        }
    },
    async execute(parameters) {
        const match = parameters.command.content.match(
            /^```(?:([a-zA-Z+-]+)\n+)?(.*)```/s
        );
        if (!match) {
            throw new Error(
                `Invalid syntax for command ${parameters.command.name}`
            );
        }

        let [, language, code] = match;
        if (!language) {
            throw new Error("No language was specified.");
        }
        language = language.toLowerCase();

        if (!this.languages.hasOwnProperty(language)) {
            throw new Error(`Language ${language} is not supported.`);
        }

        await this.run(
            { id: this.languages[language] },
            code,
            parameters.message.channel
        );
    }
});
