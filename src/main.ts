import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import projectInformation from "./components/Panels/ProjectInformation";
import elementData from "./components/Panels/Selection";
import settings from "./components/Panels/Settings";
import load from "./components/Toolbars/Sections/Import";
import { loadPlansPanel } from "./components/Panels/Plans";
import clipper from "./components/Panels/Clipper";
//import camera from "./components/Toolbars/Sections/Camera";
import selection from "./components/Toolbars/Sections/Selection";
import navigation from "./components/Panels/Navigation"
import measurement from "./components/Panels/Measurement"
import { AppManager } from "./bim-components";
import { FragmentsGroup } from "@thatopen/fragments";

BUI.Manager.init();

const components = new OBC.Components();
const container = document.getElementById("sharepoint-viewer")!;
console.log(container);
const worlds = components.get(OBC.Worlds);

const world = worlds.create<
  OBC.SimpleScene,
  OBC.OrthoPerspectiveCamera,
  OBF.PostproductionRenderer
>();
world.name = "Main";

world.scene = new OBC.SimpleScene(components);
world.scene.setup();
world.scene.three.background = null;

const viewport = BUI.Component.create<BUI.Viewport>(() => {
  return BUI.html`
    <bim-viewport>
      <bim-grid floating></bim-grid>
    </bim-viewport>
  `;
});

world.renderer = new OBF.PostproductionRenderer(components, viewport);
const { postproduction } = world.renderer;

world.camera = new OBC.OrthoPerspectiveCamera(components);

const worldGrid = components.get(OBC.Grids).create(world);
worldGrid.material.uniforms.uColor.value = new THREE.Color(0x424242);
worldGrid.material.uniforms.uSize1.value = 2;
worldGrid.material.uniforms.uSize2.value = 8;

const resizeWorld = () => {
  world.renderer?.resize();
  world.camera.updateAspect();
};

viewport.addEventListener("resize", resizeWorld);

components.init();

postproduction.enabled = true;
postproduction.customEffects.excludedMeshes.push(worldGrid.three);
postproduction.setPasses({ custom: true, ao: true, gamma: true });
postproduction.customEffects.lineColor = 0x17191c;

const appManager = components.get(AppManager);
const viewportGrid = viewport.querySelector<BUI.Grid>("bim-grid[floating]")!;
appManager.grids.set("viewport", viewportGrid);

const fragments = components.get(OBC.FragmentsManager);
const indexer = components.get(OBC.IfcRelationsIndexer);
const classifier = components.get(OBC.Classifier);
classifier.list.CustomSelections = {};

const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup();

const tilesLoader = components.get(OBF.IfcStreamer);
//tilesLoader.url = "../resources/tiles/";
tilesLoader.world = world;
tilesLoader.dbCleaner.enabled=true;
tilesLoader.culler.threshold = 10;
tilesLoader.culler.maxHiddenTime = 1000;
tilesLoader.culler.maxLostTime = 40000;

const highlighter = components.get(OBF.Highlighter);
highlighter.setup({ world });
highlighter.zoomToSelection = true;

const culler = components.get(OBC.Cullers).create(world);
culler.threshold = 0 ;

world.camera.controls.restThreshold = 0.25;
world.camera.controls.addEventListener("update", () => {
  culler.needsUpdate = true;
  tilesLoader.culler.needsUpdate = true;
});

fragments.onFragmentsLoaded.add(async (model) => {
  updatePlansPanel(model);
  if (model.hasProperties) {
    await indexer.process(model);
    classifier.byEntity(model);
  }

  for (const fragment of model.items) {
    world.meshes.add(fragment.mesh);
    culler.add(fragment.mesh);
  }

   world.scene.three.add(model);
  setTimeout(async () => {
    world.camera.fit(world.meshes, 0.8);
  }, 50);
});

fragments.onFragmentsDisposed.add(({ fragmentIDs }) => {
  for (const fragmentID of fragmentIDs) {
    const mesh = [...world.meshes].find((mesh) => mesh.uuid === fragmentID);
    if (mesh) world.meshes.delete(mesh);
  }
});

//Cargar archivos sharepoint

window.addEventListener("getIFC", async (event: any) => {
  const { name, payload } = event.detail || {};

  if (name === "IFCModel" && payload) {
    const { name, buffer } = payload;
    const model = await ifcLoader.load(buffer);
    model.name = name;
    world.scene.three.add(model);

  }
})

const updatePlansPanel = async (model: FragmentsGroup) => {
  const plansPanel = await loadPlansPanel(world, components,model);

  // Reemplazar el marcador de posición con el panel de planes cargado
  const placeholder = document.getElementById('plansPlaceholder');
  if (placeholder) {
    // Reemplazar el contenido del marcador de posición con el panel de planes
    placeholder.replaceWith(plansPanel);
  }
};

const projectInformationPanel = projectInformation(components);
const elementDataPanel = elementData(components);

const toolbar = BUI.Component.create(() => {
  return BUI.html`
    <bim-toolbar>
      ${load(components)}
      ${selection(components, world)}
    </bim-toolbar>
  `;
});

const leftPanel = BUI.Component.create(() => {
  return BUI.html`
    <bim-tabs switchers-full>
      <bim-tab name="project" label="Proyecto" icon="ph:building-fill">
        ${projectInformationPanel}
      </bim-tab>
        <bim-tab name="navig" label="Herramientas" icon="carbon:tool-kit">
        <bim-panel id="toolsPanel">
        ${navigation(world)}
        ${measurement(world, components, container)}
        ${clipper(world,components,container)}
        </bim-panel>
        </bim-tab>
        <bim-tab name="plans" label="Planos 2D" icon="simple-icons:flatpak">
        <bim-panel-section id="plansPlaceholder" active label="Plantas" class="options-menu" icon="simple-icons:flatpak">
        <bim-label> No se ha cargado ningún modelo </bim-label>
        </bim-panel-section>
      </bim-tab>
      <bim-tab name="settings" label="Opciones" icon="solar:settings-bold">
        ${settings(components)}
      </bim-tab>
    </bim-tabs> 
  `;
});

const app = document.getElementById("sharepoint-viewer") as BUI.Grid;
console.log(app);
app.layouts = {
  main: {
    template: `
      "leftPanel viewport" 1fr
      /26rem 1fr
    `,
    elements: {
      leftPanel,
      viewport,
    },
  },
};

app.layout = "main";

viewportGrid.layouts = {
  main: {
    template: `
      "empty" 1fr
      "toolbar" auto
      /1fr
    `,
    elements: { toolbar },
  },
  second: {
    template: `
      "empty elementDataPanel" 1fr
      "toolbar elementDataPanel" auto
      /1fr 24rem
    `,
    elements: {
      toolbar,
      elementDataPanel,
    },
  },
};

viewportGrid.layout = "main";