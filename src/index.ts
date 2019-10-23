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

import {
  spinalContextMenuService,
  SpinalContextApp
} from "spinal-env-viewer-context-menu-service";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";
import geographicService from "spinal-env-viewer-context-geographic-service";
const geographicConstants = geographicService.constants;
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
      (<any>window).spinal.spinalGraphService._addNode(node);
      return true;
    }
    return false;
  });
}

async function createCategory(bimDbId, model, attrs) {
  if (attrs.length === 0) return;
  let bimRealNode = await (<any>window).spinal.BimObjectService.getBIMObject(bimDbId, model);
  let categoryName = "GMAO";

  return serviceDocumentation.getCategoryByName(bimRealNode, categoryName).then(async category => {
    if (typeof category === "undefined") {
      category = await serviceDocumentation.addCategoryAttribute(bimRealNode, categoryName);
    }
    let allAttributes = await serviceDocumentation.getAllAttributes(bimRealNode);
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
      } else {
        serviceDocumentation.addAttributeByCategory(bimRealNode, category, attr.label, attr.value);
      }
    }
    return true;
  });
}

function getProps(model: any, dbid: number): Promise<{ dbId: number, properties: any[], externalId: string, name: string }> {
  return new Promise((resolve, reject) => {
    model.getProperties(dbid, (e) => { resolve(e) }, (e) => { reject(e) })
  })
}


async function getAttr(bimObjNode, model, attrsToGet) {
  const dbId = bimObjNode.info.dbid.get();
  const res = [];
  const props = await getProps(model, dbId);

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
}
class SpinalSemlGetattr extends SpinalContextApp {
  constructor() {
    super("Import Mission attribut", "Import Mission attribut", {
      icon: "collections_bookmark",
      icon_type: "in"
    });
  }

  isShown(option) {
    if (option.selectedNode.type.get() === geographicConstants.CONTEXT_TYPE) { return (Promise.resolve(true)); }
    return Promise.resolve(-1);
  }

  async action(option) {
    const context = (<any>window).spinal.spinalGraphService.getRealNode(option.selectedNode.id.get());
    const equipmentNodes = await getEquipmentNodes(context);
    for (const bimObj of equipmentNodes) {
      const bimFileId = bimObj.info.bimFileId.get();
      const model = (<any>window).spinal.BimObjectService.getModelByBimfile(bimFileId);
      // eslint-disable-next-line no-await-in-loop
      const attrs = await getAttr(bimObj, model, ['ENS GMAO', 'ID_Materiel']);
      createCategory(bimObj.info.dbid.get(), model, attrs);
    }

  }
}


export {
  SpinalSemlGetattr
};




spinalContextMenuService.registerApp("GraphManagerSideBar", new SpinalSemlGetattr(), [3]);
