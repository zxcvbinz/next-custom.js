"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getFormattedDiagnostic = getFormattedDiagnostic;
exports.DiagnosticCategory = void 0;
var _codeFrame = require("next/dist/compiled/babel/code-frame");
var _chalk = _interopRequireDefault(require("next/dist/compiled/chalk"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var DiagnosticCategory;
exports.DiagnosticCategory = DiagnosticCategory;
(function(DiagnosticCategory) {
    DiagnosticCategory[DiagnosticCategory["Warning"] = 0] = "Warning";
    DiagnosticCategory[DiagnosticCategory["Error"] = 1] = "Error";
    DiagnosticCategory[DiagnosticCategory["Suggestion"] = 2] = "Suggestion";
    DiagnosticCategory[DiagnosticCategory["Message"] = 3] = "Message";
})(DiagnosticCategory || (exports.DiagnosticCategory = DiagnosticCategory = {}));
function getFormattedLinkDiagnosticMessageText(diagnostic) {
    const message = diagnostic.messageText;
    if (typeof message === "string" && diagnostic.code === 2322) {
        const match = message.match(/Type '"(.+)"' is not assignable to type 'Route<string> | URL'\./) || message.match(/Type '"(.+)"' is not assignable to type 'URL | Route<string>'\./);
        if (match) {
            const [, href] = match;
            return `"${_chalk.default.bold(href)}" is not an existing route. If it is intentional, please type it explicitly with \`as Route\`.`;
        } else if (message === "Type 'string' is not assignable to type 'never'.") {
            var ref, ref1;
            if (((ref = diagnostic.relatedInformation) == null ? void 0 : (ref1 = ref[0]) == null ? void 0 : ref1.messageText) === `The expected type comes from property 'href' which is declared here on type 'IntrinsicAttributes & LinkRestProps & { href: never; }`) {
                return `Invalid \`href\` property of \`Link\`: the route does not exist. If it is intentional, please type it explicitly with \`as Route\`.`;
            }
        }
    }
}
function getFormattedLayoutAndPageDiagnosticMessageText(relativeSourceFilepath, diagnostic) {
    const message = typeof diagnostic.messageText === "string" ? diagnostic : diagnostic.messageText;
    const messageText = message.messageText;
    if (typeof messageText === "string") {
        const type = /page\.[^.]+$/.test(relativeSourceFilepath) ? "Page" : "Layout";
        // Reference of error codes:
        // https://github.com/Microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
        switch(message.code){
            case 2344:
                const filepathAndType = messageText.match(/typeof import\("(.+)"\)/);
                if (filepathAndType) {
                    let main = `${type} "${_chalk.default.bold(relativeSourceFilepath)}" does not match the required types of a Next.js ${type}.`;
                    function processNext(indent, next) {
                        if (!next) return;
                        for (const item of next){
                            switch(item.code){
                                case 2200:
                                    const mismatchedField = item.messageText.match(/The types of '(.+)'/);
                                    if (mismatchedField) {
                                        main += "\n" + " ".repeat(indent * 2);
                                        main += `"${_chalk.default.bold(mismatchedField[1])}" has the wrong type:`;
                                    }
                                    break;
                                case 2322:
                                    const types = item.messageText.match(/Type '(.+)' is not assignable to type '(.+)'./);
                                    if (types) {
                                        main += "\n" + " ".repeat(indent * 2);
                                        if (types[2] === "PageComponent" || types[2] === "LayoutComponent") {
                                            main += `The exported ${type} component isn't correctly typed.`;
                                        } else {
                                            main += `Expected "${_chalk.default.bold(types[2].replace('"__invalid_negative_number__"', "number (>= 0)"))}", got "${_chalk.default.bold(types[1])}".`;
                                        }
                                    }
                                    break;
                                case 2326:
                                    const invalidConfig = item.messageText.match(/Types of property '(.+)' are incompatible\./);
                                    main += "\n" + " ".repeat(indent * 2);
                                    main += `Invalid configuration${invalidConfig ? ` "${_chalk.default.bold(invalidConfig[1])}"` : ""}:`;
                                    break;
                                case 2530:
                                    const invalidField = item.messageText.match(/Property '(.+)' is incompatible with index signature/);
                                    if (invalidField) {
                                        main += "\n" + " ".repeat(indent * 2);
                                        main += `"${_chalk.default.bold(invalidField[1])}" is not a valid ${type} export field.`;
                                    }
                                    return;
                                case 2739:
                                    const invalidProp = item.messageText.match(/Type '(.+)' is missing the following properties from type '(.+)'/);
                                    if (invalidProp) {
                                        if (invalidProp[1] === "LayoutProps" || invalidProp[1] === "PageProps") {
                                            main += "\n" + " ".repeat(indent * 2);
                                            main += `Prop "${invalidProp[2]}" is incompatible with the ${type}.`;
                                        }
                                    }
                                    break;
                                case 2559:
                                    const invalid = item.messageText.match(/Type '(.+)' has/);
                                    if (invalid) {
                                        main += "\n" + " ".repeat(indent * 2);
                                        main += `Type "${_chalk.default.bold(invalid[1])}" isn't allowed.`;
                                    }
                                    break;
                                case 2741:
                                    const incompatPageProp = item.messageText.match(/Property '(.+)' is missing in type 'PageProps'/);
                                    if (incompatPageProp) {
                                        main += "\n" + " ".repeat(indent * 2);
                                        main += `Prop "${_chalk.default.bold(incompatPageProp[1])}" will never be passed. Remove it from the component's props.`;
                                    } else {
                                        const extraLayoutProp = item.messageText.match(/Property '(.+)' is missing in type 'LayoutProps' but required in type '(.+)'/);
                                        if (extraLayoutProp) {
                                            main += "\n" + " ".repeat(indent * 2);
                                            main += `Prop "${_chalk.default.bold(extraLayoutProp[1])}" is not valid for this Layout, remove it to fix.`;
                                        }
                                    }
                                    break;
                                default:
                            }
                            processNext(indent + 1, item.next);
                        }
                    }
                    if ("next" in message) processNext(1, message.next);
                    return main;
                }
                const invalidExportFnArg = messageText.match(/Type 'OmitWithTag<(.+), .+, "(.+)">' does not satisfy the constraint/);
                if (invalidExportFnArg) {
                    const main = `${type} "${_chalk.default.bold(relativeSourceFilepath)}" has an invalid "${_chalk.default.bold(invalidExportFnArg[2])}" export:\n  Type "${_chalk.default.bold(invalidExportFnArg[1])}" is not valid.`;
                    return main;
                }
                const invalidExportFnReturn = messageText.match(/Type '{ __tag__: "(.+)"; __return_type__: (.+); }' does not satisfy/);
                if (invalidExportFnReturn) {
                    let main = `${type} "${_chalk.default.bold(relativeSourceFilepath)}" has an invalid export:\n  "${_chalk.default.bold(invalidExportFnReturn[2])}" is not a valid ${invalidExportFnReturn[1]} return type:`;
                    function processNext1(indent, next) {
                        if (!next) return;
                        for (const item of next){
                            switch(item.code){
                                case 2322:
                                    const types = item.messageText.match(/Type '(.+)' is not assignable to type '(.+)'./);
                                    if (types) {
                                        main += "\n" + " ".repeat(indent * 2);
                                        main += `Expected "${_chalk.default.bold(types[2])}", got "${_chalk.default.bold(types[1])}".`;
                                    }
                                    break;
                                default:
                            }
                            processNext1(indent + 1, item.next);
                        }
                    }
                    if ("next" in message) processNext1(1, message.next);
                    return main;
                }
                break;
            case 2345:
                const filepathAndInvalidExport = messageText.match(/'typeof import\("(.+)"\)'.+Impossible<"(.+)">/);
                if (filepathAndInvalidExport) {
                    const main = `${type} "${_chalk.default.bold(relativeSourceFilepath)}" exports an invalid "${_chalk.default.bold(filepathAndInvalidExport[2])}" field. ${type} should only export a default React component and configuration options. Learn more: https://nextjs.org/docs/messages/invalid-segment-export`;
                    return main;
                }
                break;
            case 2559:
                const invalid1 = messageText.match(/Type '(.+)' has no properties in common with type '(.+)'/);
                if (invalid1) {
                    const main = `${type} "${_chalk.default.bold(relativeSourceFilepath)}" contains an invalid type "${_chalk.default.bold(invalid1[1])}" as ${invalid1[2]}.`;
                    return main;
                }
                break;
            default:
        }
    }
}
function getAppEntrySourceFilePath(baseDir, diagnostic) {
    var ref, ref2;
    const sourceFilepath = ((ref2 = (ref = diagnostic.file) == null ? void 0 : ref.text.trim().match(/^\/\/ File: (.+)\n/)) == null ? void 0 : ref2[1]) || "";
    return _path.default.relative(baseDir, sourceFilepath);
}
function getFormattedDiagnostic(ts, baseDir, distDir, diagnostic, isAppDirEnabled) {
    var ref;
    // If the error comes from .next/types/, we handle it specially.
    const isLayoutOrPageError = isAppDirEnabled && ((ref = diagnostic.file) == null ? void 0 : ref.fileName.startsWith(_path.default.join(baseDir, distDir, "types")));
    let message = "";
    const appPath = isLayoutOrPageError ? getAppEntrySourceFilePath(baseDir, diagnostic) : null;
    const linkReason = getFormattedLinkDiagnosticMessageText(diagnostic);
    const appReason = !linkReason && isLayoutOrPageError && appPath ? getFormattedLayoutAndPageDiagnosticMessageText(appPath, diagnostic) : null;
    const reason = linkReason || appReason || ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    const category = diagnostic.category;
    switch(category){
        // Warning
        case 0:
            {
                message += _chalk.default.yellow.bold("Type warning") + ": ";
                break;
            }
        // Error
        case 1:
            {
                message += _chalk.default.red.bold("Type error") + ": ";
                break;
            }
        // 2 = Suggestion, 3 = Message
        case 2:
        case 3:
        default:
            {
                message += _chalk.default.cyan.bold(category === 2 ? "Suggestion" : "Info") + ": ";
                break;
            }
    }
    message += reason + "\n";
    if (!isLayoutOrPageError && diagnostic.file) {
        const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const line = pos.line + 1;
        const character = pos.character + 1;
        let fileName = _path.default.posix.normalize(_path.default.relative(baseDir, diagnostic.file.fileName).replace(/\\/g, "/"));
        if (!fileName.startsWith(".")) {
            fileName = "./" + fileName;
        }
        message = _chalk.default.cyan(fileName) + ":" + _chalk.default.yellow(line.toString()) + ":" + _chalk.default.yellow(character.toString()) + "\n" + message;
        message += "\n" + (0, _codeFrame).codeFrameColumns(diagnostic.file.getFullText(diagnostic.file.getSourceFile()), {
            start: {
                line: line,
                column: character
            }
        }, {
            forceColor: true
        });
    } else if (isLayoutOrPageError && appPath) {
        message = _chalk.default.cyan(appPath) + "\n" + message;
    }
    return message;
}

//# sourceMappingURL=diagnosticFormatter.js.map