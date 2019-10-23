import { SpinalContextApp } from "spinal-env-viewer-context-menu-service";
declare class SpinalSemlGetattr extends SpinalContextApp {
    constructor();
    isShown(option: any): Promise<boolean> | Promise<number>;
    action(option: any): Promise<void>;
}
export { SpinalSemlGetattr };
