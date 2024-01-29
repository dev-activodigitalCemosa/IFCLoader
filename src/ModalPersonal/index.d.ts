import { Event } from "openbim-components/base-types";
import { Components } from "openbim-components/core";
import { SimpleUIComponent } from "openbim-components/ui/SimpleUIComponent";
export  declare class ModalPersonal extends SimpleUIComponent<HTMLDialogElement> {
    readonly onAccept: Event<unknown>;
    readonly onCancel: Event<unknown>;
    set description(value: string | null);
    get description(): string | null;
    set title(value: string | null);
    get title(): string | null;
    set visible(value: boolean);
    get visible(): boolean;
    slots: {
        content: SimpleUIComponent<HTMLDirectoryElement>;
        actionButtons: SimpleUIComponent<HTMLDivElement>;
    };
    innerElements: {
        title: HTMLHeadElement;
        description: HTMLParagraphElement;
    };
    constructor(components: Components, title?: string,buttonsData: ButtonInfo[] = []);
    dispose(onlyChildren?: boolean): Promise<void>;
}
