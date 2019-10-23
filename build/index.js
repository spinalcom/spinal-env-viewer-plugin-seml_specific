"use strict";
/*
 * Copyright 2018 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_env_viewer_context_menu_service_1 = require("spinal-env-viewer-context-menu-service");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
const spinal_env_viewer_context_geographic_service_1 = require("spinal-env-viewer-context-geographic-service");
const geographicConstants = spinal_env_viewer_context_geographic_service_1.default.constants;
const SELECTrelationList = [
    geographicConstants.SITE_RELATION,
    geographicConstants.BUILDING_RELATION,
    geographicConstants.FLOOR_RELATION,
    geographicConstants.ZONE_RELATION,
    geographicConstants.ROOM_RELATION,
    geographicConstants.EQUIPMENT_RELATION,
    geographicConstants.REFERENCE_RELATION,
    // for old system
    'hasReferenceObject',
    "hasBIMObject"
];
function getEquipmentNodes(context) {
    return context.find(SELECTrelationList, (node) => {
        if (node.info.type.get() === geographicConstants.EQUIPMENT_TYPE) {
            window.spinal.spinalGraphService._addNode(node);
            return true;
        }
        return false;
    });
}
function createCategory(bimDbId, model, attrs) {
    return __awaiter(this, void 0, void 0, function* () {
        if (attrs.length === 0)
            return;
        let bimRealNode = yield window.spinal.BimObjectService.getBIMObject(bimDbId, model);
        let categoryName = "GMAO";
        return spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.getCategoryByName(bimRealNode, categoryName).then((category) => __awaiter(this, void 0, void 0, function* () {
            if (typeof category === "undefined") {
                category = yield spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.addCategoryAttribute(bimRealNode, categoryName);
            }
            let allAttributes = yield spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.getAllAttributes(bimRealNode);
            for (const element of allAttributes) {
                for (const attr of attrs) {
                    if (element.label.get() == attr.label) {
                        attr.model = element;
                    }
                }
            }
            for (const attr of attrs) {
                if (attr.element) {
                    attr.model.value.set(attr.value);
                }
                else {
                    spinal_env_viewer_plugin_documentation_service_1.serviceDocumentation.addAttributeByCategory(bimRealNode, category, attr.label, attr.value);
                }
            }
            return true;
        }));
    });
}
function getProps(model, dbid) {
    return new Promise((resolve, reject) => {
        model.getProperties(dbid, (e) => { resolve(e); }, (e) => { reject(e); });
    });
}
function getAttr(bimObjNode, model, attrsToGet) {
    return __awaiter(this, void 0, void 0, function* () {
        const dbId = bimObjNode.info.dbid.get();
        const res = [];
        const props = yield getProps(model, dbId);
        for (const property of props.properties) {
            for (const attrToGet of attrsToGet) {
                if (attrToGet === property.attributeName && property.displayValue) {
                    res.push({
                        label: property.attributeName,
                        model: null,
                        value: property.displayValue
                    });
                    continue;
                }
            }
        }
        return res;
    });
}
class SpinalSemlGetattr extends spinal_env_viewer_context_menu_service_1.SpinalContextApp {
    constructor() {
        super("Import Mission attribut", "Import Mission attribut", {
            icon: "collections_bookmark",
            icon_type: "in"
        });
    }
    isShown(option) {
        if (option.selectedNode.type.get() === geographicConstants.CONTEXT_TYPE) {
            return (Promise.resolve(true));
        }
        return Promise.resolve(-1);
    }
    action(option) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = window.spinal.spinalGraphService.getRealNode(option.selectedNode.id.get());
            const equipmentNodes = yield getEquipmentNodes(context);
            for (const bimObj of equipmentNodes) {
                const bimFileId = bimObj.info.bimFileId.get();
                const model = window.spinal.BimObjectService.getModelByBimfile(bimFileId);
                // eslint-disable-next-line no-await-in-loop
                const attrs = yield getAttr(bimObj, model, ['ENS GMAO', 'ID_Materiel']);
                createCategory(bimObj.info.dbid.get(), model, attrs);
            }
        });
    }
}
exports.SpinalSemlGetattr = SpinalSemlGetattr;
spinal_env_viewer_context_menu_service_1.spinalContextMenuService.registerApp("GraphManagerSideBar", new SpinalSemlGetattr(), [3]);
//# sourceMappingURL=index.js.map