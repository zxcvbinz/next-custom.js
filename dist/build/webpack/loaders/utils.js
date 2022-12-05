"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isClientComponentModule = isClientComponentModule;
exports.regexCSS = void 0;
var _constants = require("../../../shared/lib/constants");
const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "avif"
];
const imageRegex = new RegExp(`\\.(${imageExtensions.join("|")})$`);
function isClientComponentModule(mod) {
    var ref;
    const hasClientDirective = ((ref = mod.buildInfo.rsc) == null ? void 0 : ref.type) === _constants.RSC_MODULE_TYPES.client;
    return hasClientDirective || imageRegex.test(mod.resource);
}
const regexCSS = /\.(css|scss|sass)(\?.*)?$/;
exports.regexCSS = regexCSS;

//# sourceMappingURL=utils.js.map