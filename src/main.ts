import * as OBC from "openbim-components"
import * as THREE from "three"
//import * as OBC from "./openbim-components/index"
import * as Stats from "stats.js"
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js';

var posicion = 0;

const viewer = new OBC.Components()
viewer.onInitialized.add(() => { })

const sceneComponent = new OBC.SimpleScene(viewer)
sceneComponent.setup()
viewer.scene = sceneComponent

const viewerContainer = document.getElementById("sharepoint-viewer") as HTMLDivElement
const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer)

// pantalla de estadisticas
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
stats.dom.style.left = '0px';
rendererComponent.onBeforeUpdate.add(() => stats.begin());
rendererComponent.onAfterUpdate.add(() => stats.end());

viewer.renderer = rendererComponent
const postproduction = rendererComponent.postproduction

const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer)
viewer.camera = cameraComponent

const raycasterComponent = new OBC.SimpleRaycaster(viewer)
viewer.raycaster = raycasterComponent


viewer.init()
postproduction.enabled = true

const grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666))
postproduction.customEffects.excludedMeshes.push(grid.get())

const ifcLoader = new OBC.FragmentIfcLoader(viewer)


ifcLoader.settings.wasm = {
  absolute: true,
  path: "https://unpkg.com/web-ifc@0.0.44/",
};

const disposer = new OBC.Disposer(viewer);
const highlighter = new OBC.FragmentHighlighter(viewer);
highlighter.setup()

const propertiesProcessor2 = new OBC.IfcPropertiesProcessor(viewer)
const hider = new OBC.FragmentHider(viewer);
await hider.loadCached();


let storeysGui = new dat.GUI({ autoPlace: true });
storeysGui.hide();
storeysGui.domElement.style.width = '290px';
storeysGui.domElement.style.position = 'absolute';
storeysGui.domElement.style.top = posicion + 'px';
storeysGui.domElement.style.right = '10px';

const showThreeGui = new OBC.Button(viewer, { materialIconName: 'account_tree', tooltip: 'Arbol de entidades' });
showThreeGui.onClick.add(() => {
  if (storeysGui._hidden) {
    storeysGui.show();
  } else {
    storeysGui.hide();
  }
});
// Obtener el contenedor del GUI

ifcLoader.onIfcLoaded.add(async model => {
  posicion = posicion + 40;
  const classifier = new OBC.FragmentClassifier(viewer);
  classifier.byStorey(model);
  classifier.byEntity(model);
  
  console.log(model);
  const classifications = classifier.get();
  const storeyNames = Object.keys(classifications.storeys).sort();

  // Crear un objeto para almacenar las plantas o pisos y sus clases correspondientes
  const storeys: Record<string, Record<string, boolean>> = {};

  // Agregar las plantas o pisos y sus clases al objeto
  for (const storeyName of storeyNames) {
    storeys[storeyName] = {};

    for (const className in classifications.entities) {
      const found = await classifier.find({ storeys: [storeyName], entities: [className] });

      // Verifica si entity.storeys es un conjunto y si contiene storeyName
      if (found && Object.keys(found).some(fragmentID => found[fragmentID].size > 0)) {
        storeys[storeyName][className] = true;
      }
    }
  }


  // Crear el GUI
  storeysGui.title("Estructura IFC")
  //toreysGui = gui.addFolder("Estructura IFC");

  // Agregar las plantas o pisos al GUI
  for (const storeyName in storeys) {
    const storeyFolder = storeysGui.addFolder(storeyName);
    storeyFolder.close();
    storeyFolder.domElement.style.paddingLeft = '10px';
    // Agregar las clases correspondientes a cada planta o piso al GUI
    for (const className in storeys[storeyName]) {
      const classFolder = storeyFolder.addFolder(className); // Crear un folder para cada clase
      classFolder.close();
      classFolder.domElement.style.paddingLeft = '15px'
      // Obtener los elementos correspondientes a esta clase y planta
      const found = await classifier.find({ storeys: [storeyName], entities: [className] });
      // Agregar un control para cada elemento de la clase
      for (const fragmentID in found) {
        const comprobante: string[] = [];
        const fragmentSet = found[fragmentID];
        fragmentSet.forEach(fragment => {
          const numberID = fragment; // Obtener el fragment ID del elemento actual  
          const visible = true; // Puedes establecer si el elemento está visible inicialmente
          const fragmento: OBC.FragmentIdMap = {};
          fragmento[fragmentID] = new Set([numberID]);
          //añadir elementos a la carpeta
          comprobante.push(numberID+"_"+fragmentID);
          const onChangeFunction = async (isVisible: boolean) => {
            hider.set(isVisible, fragmento);
          };
          let existe = false;
          classFolder.controllers.forEach(element => {
            if (element._name == classFolder._title + " (" + numberID + ")"){
              existe = true
            }});
          const control = classFolder.add({ [numberID+"_"+fragmentID]: visible }, numberID+"_"+fragmentID).onChange(async (isVisible) => {
            hider.set(isVisible, fragmento);
          }).name(classFolder._title + " (" + numberID + ")");
          control.onChange(onChangeFunction).domElement.style.paddingLeft = '15px';
          if (existe){ control.hide();}
        });

        classFolder.controllers.forEach(controller => {
          if (comprobante.includes(controller.property)) {
            controller.domElement.addEventListener('', () => {
            });

            controller.domElement.addEventListener('mouseover', () => {
              if (controller.domElement.style.backgroundColor != 'snow') {
                controller.domElement.style.backgroundColor = 'white';
                controller.domElement.style.color = 'black';
                const fragmento: OBC.FragmentIdMap = {};
                var [parte1, parte2] = controller.property.split("_");
                fragmento[parte2] = new Set([parte1]);
                highlighter.highlightByID('hover', fragmento);
              }
            });

            // Evento para eliminar el resaltado cuando el cursor sale del controller
            controller.domElement.addEventListener('mouseout', () => {
              // Restaura el color de fondo predeterminado
              if (controller.domElement.style.backgroundColor != 'snow') {
                controller.domElement.style.backgroundColor = '';
                controller.domElement.style.color = 'white';

              }
            });

            controller.domElement.addEventListener('dblclick', (e) => {

              e.stopPropagation();
              const fragmento: OBC.FragmentIdMap = {};
              classFolder.controllers.forEach(element => {
                if (element._name === controller._name){
                var [parte1, parte2] = element.property.split("_");
                fragmento[parte2] = new Set([parte1]);
                }
              });  
     
              highlighter.highlightByID("select", fragmento, true, true)
           
            });
          }
        })
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.id = `checkbox-${storeyName}-${className}`;
      checkbox.name = `checkbox-${storeyName}-${className}`;

      // Agregar el checkbox al DOM de classFolder
      classFolder.$title.insertAdjacentText('beforeend', "      ");
      classFolder.$title.insertAdjacentElement('beforeend', checkbox);

      checkbox.addEventListener('click', (event) => {
        event.stopPropagation();
        //const isChecked = checkbox.checked;

        classFolder.controllers.forEach(controller => {
          const inputElement = controller.domElement.querySelector('input');
          if (inputElement !== null) {
            inputElement.click();
          } else {
            console.error('No se encontró ningún elemento de entrada (input) dentro del controlador.');
          }

        })
      });

    }
  }


})

ifcLoader.onIfcLoaded.add(async model => {
  propertiesProcessor2.process(model)
  highlighter.events.select.onHighlight.add((selection) => {
    const fragmentID = Object.keys(selection)[0]
    console.log(selection);
    const expressID = Number([...selection[fragmentID]][0])
    propertiesProcessor2.renderProperties(model, expressID)
    storeysGui.folders.forEach(folder1 => {
      folder1.folders.forEach(folder2 => {
        folder2.controllers.forEach(controller => {
          var [parte1, parte2] = controller.property.split("_");
          if (parte1 == expressID.toString()) {
            console.log(controller);
            folder1.open();
            folder2.open();
            controller.domElement.style.backgroundColor = 'snow';
            controller.domElement.style.color = 'black';
            controller.domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            controller.domElement.style.backgroundColor = '';
            controller.domElement.style.color = 'white';
          }
        });
      });
    });
  })
  highlighter.update()
})


// boton para cargar modelos desde sharepoint
const loadModal = new OBC.Button(viewer, { materialIconName: 'folder_open', tooltip: 'Abrir IFC Sharepoint' });
loadModal.onClick.add(() => {
  const clickEvent = new CustomEvent("loadModalClick");
  window.dispatchEvent(clickEvent);
});

// botón para limpiar modelos
const clearModelsButton = new OBC.Button(viewer, { materialIconName: 'delete', tooltip: 'Borrar modelo' });
clearModelsButton.onClick.add(() => {
  clearModels();
});

// Función para limpiar modelos
function clearModels() {
  window.location.reload();
}

// Cubo para ver las caras del visor
const cuboPerspective = new OBC.CubeMap(viewer);
cuboPerspective.setPosition("bottom-left");
cuboPerspective.setSize("5000");



// codigo para pegar cortes al modelo

const clipper = new OBC.SimpleClipper(viewer);
clipper.enabled = true;
clipper.uiElement.get("main").domElement.onclick = () => {
  if (guiShorcuts._hidden) {
    guiShorcuts.show();
    clipper.enabled = true;
    clipper.visible = true;

  } else {
    guiShorcuts.hide();
    clipper.enabled = false;
    clipper.visible = false;
  }
};

viewerContainer.ondblclick = () => clipper.create();

window.onkeydown = (event) => {
  if (event.code === 'Delete' || event.code === 'Backspace') {
    clipper.delete();
  }
}

const createButton = new OBC.Button(viewer);
createButton.label = "Añadir plano";
createButton.onClick.add(() => { clipper.create() });

const deleteButton = new OBC.Button(viewer);
deleteButton.label = "Borrar plano";
deleteButton.onClick.add(() => { clipper.delete() });

const aislarSelectedButton = new OBC.Button(viewer);
aislarSelectedButton.label = "Aislar seleccionado";
aislarSelectedButton.onClick.add(() => {
  const primeraPropiedad = Object.keys(highlighter.selection.select)[0];
  // Obtener el conjunto dentro de la primera propiedad
  const conjunto = highlighter.selection.select[primeraPropiedad];
  // Obtener el primer elemento del conjunto
  let primerElemento;
  if (conjunto) {
    storeysGui.folders.forEach(folder1 => {
      folder1.folders.forEach(folder2 => {
        const storeyNameEscaped = folder1._title.replace(/\s/g, '\\ '); // Escapa los espacios en el nombre de la planta
        const classNameEscaped = folder2._title.replace(/\s/g, '\\ '); // Escapa los espacios en el nombre de la clase
        const checkbox = folder2.$title.querySelector(`#checkbox-${storeyNameEscaped}-${classNameEscaped}`) as HTMLInputElement;

        if (checkbox.checked == false) {
          checkbox.checked = true;
        } else {
          checkbox.checked = false;
        }
        folder2.controllers.forEach(controller => {

          primerElemento = [...conjunto][0];
          var [parte1, parte2] = controller.property.split("_");
          if (parte1 !== primerElemento) {
            const inputElement = controller.domElement.querySelector('input');
            if (inputElement !== null && inputElement.checked == true) {
              inputElement.click();
            } else {
              console.error('No se encontró ningún elemento de entrada (input) dentro del controlador.');
            }
          } else {
            checkbox.checked = true;
          }


        });
      });
    });
  } else {
    console.log("El conjunto está vacío");
  }
});

const mostrarTodoButton = new OBC.Button(viewer);
mostrarTodoButton.label = "Mostrar todo";
mostrarTodoButton.onClick.add(() => {
 
    storeysGui.folders.forEach(folder1 => {
      folder1.folders.forEach(folder2 => {
        const storeyNameEscaped = folder1._title.replace(/\s/g, '\\ '); // Escapa los espacios en el nombre de la planta
        const classNameEscaped = folder2._title.replace(/\s/g, '\\ '); // Escapa los espacios en el nombre de la clase
        const checkbox = folder2.$title.querySelector(`#checkbox-${storeyNameEscaped}-${classNameEscaped}`) as HTMLInputElement;

        if (checkbox.checked == false) {
          checkbox.checked = true;
        } 
        folder2.controllers.forEach(controller => {

            const inputElement = controller.domElement.querySelector('input');
            if (inputElement !== null && inputElement.checked == false) {
              inputElement.click();
            } else {
              console.error('No se encontró ningún elemento de entrada (input) dentro del controlador.');
            }

        });
      });
    });
});



viewer.ui.contextMenu.addChild(createButton, deleteButton, aislarSelectedButton, mostrarTodoButton);
clipper.uiElement.get("main").active = false;
// Set up dat.gui menu

const guiShorcuts = new dat.GUI();
guiShorcuts.hide();
guiShorcuts.domElement.style.top = '50px';        // Distancia desde el borde superior
guiShorcuts.domElement.style.left = '0px';
const shortcutsFolder = guiShorcuts.addFolder('Shortcuts');

const shortcuts = {
  'Create clipping plane': "Double click",
  'Delete clipping plane': "Delete"
}
shortcutsFolder.add(shortcuts, 'Create clipping plane');
shortcutsFolder.add(shortcuts, 'Delete clipping plane');

const actionsFolder = guiShorcuts.addFolder('Actions');

actionsFolder.add(clipper, 'enabled').name("Toggle clipping planes enabled");
actionsFolder.add(clipper, 'visible').name("Toggle clipping planes visible");
clipper.material = new THREE.MeshStandardMaterial({
  color: 0x0000ff, // Color azul (puedes cambiarlo según tus necesidades)
  side: THREE.DoubleSide, // Renderizar en ambos lados del plano
  transparent: true, // Hacer el material transparente
  opacity: 0.5 // Establecer la opacidad (ajusta según tus necesidades)
  });


actionsFolder.add(clipper, 'size').name("Plane Size").min(0).max(25);
//actionsFolder.add(clipper.material, 'opacity').name("Plane Opacity").min(0).max(1);
const actions = {
  'Delete all planes': () => {
    clipper.deleteAll();
  }
}

actionsFolder.add(actions, 'Delete all planes');


//añadir elementos a la barra de abajo
const mainToolbar = new OBC.Toolbar(viewer)
mainToolbar.addChild(
  ifcLoader.uiElement.get("main"),
  loadModal,
  clearModelsButton,
  showThreeGui,
  propertiesProcessor2.uiElement.get("main"),
  clipper.uiElement.get("main")
  //propertiesManager.uiElement.get("exportButton"),
  //propertiesFinder.uiElement.get("main"),

)


viewer.ui.addToolbar(mainToolbar);


window.addEventListener("getIFC", async (event: any) => {
  const { name, payload } = event.detail || {};

  if (name === "IFCModel" && payload) {

    const { name, buffer } = payload;
    const model = await ifcLoader.load(buffer, name);
    const scene = viewer.scene.get();
    scene.add(model);

  }


})
