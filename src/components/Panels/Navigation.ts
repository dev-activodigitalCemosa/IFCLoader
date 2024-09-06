import * as BUI from "@thatopen/ui"
import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front";


export default (world: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBF.PostproductionRenderer>) => {

  const onFitModel = () => {
    if (world.camera instanceof OBC.OrthoPerspectiveCamera && world.meshes.size > 0) {
      world.camera.fit(world.meshes, 0.5)
    }
  }

  const onLock = (e: Event) => {
    const button = e.target as BUI.Button
    world.camera.enabled = !world.camera.enabled
    button.active = !world.camera.enabled
    button.label = world.camera.enabled ? "Bloquear" : "Desbloquear"
    button.icon = world.camera.enabled ? "tabler:lock-filled" : "majesticons:unlock-open"
  }


  //BUI.Manager.init();
  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
      <bim-panel-section label="Cámara" icon="pepicons-pop:camera">
         
          <bim-dropdown required label="Modo de navegación" 
            @change="${({ target }: { target: BUI.Dropdown }) => {
        const selected = target.value[0] as OBC.NavModeID;

        const { current } = world.camera.projection;
        const isOrtho = current === "Orthographic";
        const isFirstPerson = selected === "FirstPerson";
        if (isOrtho && isFirstPerson) {
          alert("Primera persona no es compatible con ortográfica!");
          target.value[0] = world.camera.mode.id;
          return;
        }
        world.camera.set(selected);
      }}">  

          <bim-option checked label="Orbit"></bim-option>
          <bim-option label="FirstPerson"></bim-option>
          <bim-option label="Plan"></bim-option>
        </bim-dropdown>
         
      
        <bim-dropdown required label="Proyección de la cámara" 
            @change="${({ target }: { target: BUI.Dropdown }) => {
        const selected = target.value[0] as OBC.CameraProjection;
        console.log(selected);
        const isOrtho = selected === "Orthographic";
        const isFirstPerson = world.camera.mode.id === "FirstPerson";
        if (isOrtho && isFirstPerson) {
          alert("Primera persona no es compatible con ortográfica!");
          target.value[0] = world.camera.projection.current;
          return;
        }
        world.camera.projection.set(selected);
      }}">
          <bim-option checked label="Perspective"></bim-option>
          <bim-option label="Orthographic"></bim-option>
        </bim-dropdown>

       <bim-button 
        label="Centrar modelo" icon="material-symbols:fit-screen-rounded" @click=${onFitModel}>
        </bim-button>
      <bim-button 
          label="Bloquear" icon="tabler:lock-filled" @click=${onLock} .active=${!world.camera.enabled}></bim-button>

      </bim-panel-section>
    `;
  });

}
