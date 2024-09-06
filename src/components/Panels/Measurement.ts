import * as BUI from "@thatopen/ui"
import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front";


export default (world: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBF.PostproductionRenderer>, components: OBC.Components, container: HTMLElement) => {

  //const container = document.getElementById("container")!;
  const dimensions = components.get(OBF.LengthMeasurement);
  dimensions.world = world;
  dimensions.enabled = false;
  dimensions.snapDistance = 1;

  const dimensionsArea = components.get(OBF.FaceMeasurement);
  dimensionsArea.world = world;
  dimensionsArea.enabled = false;

  const dimensionsVolume = components.get(OBF.VolumeMeasurement);
  const highlighter = components.get(OBF.Highlighter);
  dimensionsVolume.world = world;
  dimensionsVolume.enabled = false;

  const activateButton = (buttonType: string) => {
    const isActive = (buttonType === 'length' && dimensions.enabled) ||
      (buttonType === 'area' && dimensionsArea.enabled) ||
      (buttonType === 'volume' && dimensionsVolume.enabled);

    // Desactivar todos los tipos de medición
    dimensions.enabled = false;
    dimensions.visible = false;
    dimensionsArea.enabled = false;
    dimensionsVolume.enabled = false;

    // Limpiar mediciones de volumen si se cambia de longitud o área
    if (buttonType === 'length' || buttonType === 'area') {
      dimensionsVolume.clear();
    }

    // Activar el botón seleccionado si estaba inactivo
    if (!isActive) {
      if (buttonType === 'length') {
        dimensions.enabled = true;
        dimensions.visible = true;
      } else if (buttonType === 'area') {
        dimensionsArea.enabled = true;
      } else if (buttonType === 'volume') {
        dimensionsVolume.enabled = true;
      }
    }

    const lengthButton = document.getElementById('length-button') as BUI.Button;
    const areaButton = document.getElementById('area-button') as BUI.Button;
    const volumeButton = document.getElementById('volume-button') as BUI.Button;

    lengthButton.active = dimensions.enabled;
    areaButton.active = dimensionsArea.enabled;
    volumeButton.active = dimensionsVolume.enabled;
  };


  const onLongitud = () => {
    activateButton('length');
    container.onclick = () => dimensions.create();
  }

  const onArea = () => {
    activateButton('area');
    container.onclick = () => {
      dimensionsArea.deleteAll();
      dimensionsArea.create();
    }
  }

  const onVolume = () => {
    activateButton('volume');
    container.onclick = () => dimensionsVolume.create();
  }

  highlighter.events.select.onHighlight.add((event) => {
    if (dimensionsVolume.enabled) {
      const volume = dimensionsVolume.getVolumeFromFragments(event);
      console.log(volume);
    }
  });

  highlighter.events.select.onClear.add(() => {
    if (dimensionsVolume.enabled) {
      dimensionsVolume.clear();
    }
  });

  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
    <bim-panel-section label="Medidas" icon="gis:measure">
            <div style="display: flex; gap: 0.375rem;">
            <bim-label>Medir longitud</bim-label>
            <bim-button id="length-button" style="margin-left: auto; flex: 0.51"
            .active=${dimensions.enabled}   
            @click=${onLongitud}
               icon="fluent:arrow-fit-20-filled"></bim-button>

          </div>
           <div style="display: flex; gap: 0.375rem;">
            <bim-label>Medir área</bim-label>
            <bim-button id="area-button" style="margin-left: auto; flex: 0.48" 
             .active=${dimensionsArea.enabled}  
            @click=${onArea}
            icon="material-symbols:square-outline"></bim-button>

          </div>
           <div style="display: flex; gap: 0.375rem;">
            <bim-label>Medir volumen</bim-label>
            <bim-button id="volume-button" style="margin-left: auto; flex: 0.52" 
            .active=${dimensionsVolume.enabled}  
            @click=${onVolume}
            icon="ph:cube-bold"></bim-button>
          </div>
          
          <bim-button label="Borrar Mediciones" icon="ph:trash-bold"
            @click="${() => {
        dimensions.deleteAll();
        dimensionsArea.deleteAll();
        dimensionsVolume.clear();
      }}">
          </bim-button>
  
        </bim-panel-section>
      `;
  });


}
