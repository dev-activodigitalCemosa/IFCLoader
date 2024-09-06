import * as BUI from "@thatopen/ui"
import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front";


export default (world: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBF.PostproductionRenderer>,components: OBC.Components,container: HTMLElement) => {
  
  const casters = components.get(OBC.Raycasters);
  casters.get(world);
  const clipper = components.get(OBC.Clipper);
  clipper.enabled = false;

  container.ondblclick = () => {
    if (clipper.enabled) {
      clipper.create(world);
      
    }
  };

  window.onkeydown = (event) => {
    if (event.code === "Delete" || event.code === "Backspace") {
      if (clipper.enabled) {
        clipper.delete(world);
      }
    }
  };



  //BUI.Manager.init();
  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
       <bim-panel-section label="Cortes" class="options-menu" icon="vaadin:scissors">
          
        <bim-checkbox label="Habilitar cortes" 
          @change="${({ target }: { target: BUI.Checkbox }) => {
            clipper.enabled = target.value;
            clipper.deleteAll();
          }}">
        </bim-checkbox>
        
        <bim-checkbox label="Cortes visibles" checked 
          @change="${({ target }: { target: BUI.Checkbox }) => {
            clipper.visible = target.value;
          }}">
        </bim-checkbox>
      
        <bim-color-input 
          label="Color del plano" color="#202932" 
          @input="${({ target }: { target: BUI.ColorInput }) => {
            clipper.material.color.set(target.color);
          }}">
        </bim-color-input>
        
        <bim-number-input 
          slider step="0.01" label="Opacidad del plano" value="0.2" min="0.1" max="1"
          @change="${({ target }: { target: BUI.NumberInput }) => {
            clipper.material.opacity = target.value;
          }}">
        </bim-number-input>
        
        <bim-number-input 
          slider step="0.1" label="Tamaño del plano" value="5" min="2" max="10"
          @change="${({ target }: { target: BUI.NumberInput }) => {
            clipper.size = target.value;
          }}">
        </bim-number-input>
        
        <bim-button 
          label="Borrar todo" 
          @click="${() => {
            clipper.deleteAll();
          }}">  
        </bim-button>        

    </bim-panel-section>
    `;
  });

}
