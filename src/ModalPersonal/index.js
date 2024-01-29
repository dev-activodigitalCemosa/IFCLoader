import { Event } from "openbim-components/base-types";
import { Button } from "openbim-components/ui/ButtonComponent";
import { SimpleUIComponent } from "openbim-components/ui/SimpleUIComponent";
export class ModalPersonal extends SimpleUIComponent {
    set description(value) {
        const element = this.innerElements.description;
        element.textContent = value;
        if (value) {
            element.classList.remove("hidden");
        }
        else {
            element === null || element === void 0 ? void 0 : element.classList.add("hidden");
        }
    }
    get description() {
        return this.innerElements.description.textContent;
    }
    set title(value) {
        const element = this.innerElements.title;
        element.textContent = value;
        if (value) {
            element.classList.remove("hidden");
        }
        else {
            element.classList.add("hidden");
        }
    }
    get title() {
        return this.innerElements.title.textContent;
    }
   // set visible(value) {
   //     this._visible = value;
    //    if (value) {
     //       this.get().showModal();
      //      this.onVisible.trigger();
       // }
       // else {
        //    this.get().close();
         //   this.onHidden.trigger();
       // }
    //}

    set visible(value) {
        this._visible = value;
        const modalElement = this.get();
        if (value) {
            this.get().showModal();  
            this.onVisible.trigger();
        } else {
            this.get().close();
            this.onHidden.trigger();
        }
    }
    get visible() {
        return this._visible;
    }
    constructor(components, title = "Tooeen Modal",buttonsData = []) {
        const template = `
    <dialog>
        <div class="flex flex-col w-[350px] h-fit text-white bg-ifcjs-100 rounded-md">
        <div class="flex justify-between items-center top-0 select-none px-6 py-3 border-b-2 border-solid border-[#3A444E]">
          <h3 id="title">${title}</h3>
          <p id="description" class="text-base text-gray-400"></p>
        </div>
        <div data-tooeen-slot="content"></div>
        <div data-tooeen-slot="actionButtons"></div>
      </div>
    </dialog> 
    `;
        super(components, template);
        this.onAccept = new Event();
        this.onCancel = new Event();
        this.innerElements = {
            title: this.getInnerElement("title"),
            description: this.getInnerElement("description"),
        };
        this.slots = {
            content: new SimpleUIComponent(components),
            actionButtons: new SimpleUIComponent(components, `<div class="flex gap-x-2 justify-end p-4"></div>`),
        };
        this.setSlots();
        const acceptBtn = new Button(this._components);
        acceptBtn.materialIcon = "check";
        acceptBtn.label = "Accept";
        acceptBtn.get().classList.remove("hover:bg-ifcjs-200");
        acceptBtn.get().classList.add("hover:bg-success");
        acceptBtn.onClick.add(() => this.onAccept.trigger());
        const cancelBtn = new Button(this._components);
        cancelBtn.materialIcon = "close";
        cancelBtn.label = "Cancel";
        cancelBtn.get().classList.remove("hover:bg-ifcjs-200");
        cancelBtn.get().classList.add("hover:bg-error");
        cancelBtn.onClick.add(() => this.onCancel.trigger());
        this.slots.actionButtons.addChild(cancelBtn, acceptBtn);

        buttonsData.forEach(buttonInfo => {
            const nuevoBoton = new Button(this._components);
            nuevoBoton.materialIcon = buttonInfo.icon || "extension";
            nuevoBoton.label = buttonInfo.label || "Nuevo Botón";
            nuevoBoton.get().classList.remove("hover:bg-ifcjs-200");
            nuevoBoton.get().classList.add("hover:bg-error");
            nuevoBoton.onClick.add(() => {
                // Lógica cuando se hace clic en el botón dinámico
                console.log(`Clic en el botón: ${buttonInfo.label}`);
            });

            // Agregar el nuevo botón a la sección de botones de acción
            this.slots.actionButtons.addChild(nuevoBoton);

            this.slots.actionButtons.get().style.display = "flex";
            this.slots.actionButtons.get().style.flexDirection = "column";
        });

    }
    async dispose(onlyChildren = false) {
        await super.dispose(onlyChildren);
        this.onCancel.reset();
        this.onAccept.reset();
    }
}
//# sourceMappingURL=index.js.map