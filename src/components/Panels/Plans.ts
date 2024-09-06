import * as BUI from "@thatopen/ui"
import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front";
import * as THREE from "three";
import { FragmentsGroup } from "@thatopen/fragments";


export const loadPlansPanel = async (world: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBF.PostproductionRenderer>, components: OBC.Components,model: FragmentsGroup) => {

  const plans = components.get(OBF.Plans);
  plans.world = world;
  const fragments = components.get(OBC.FragmentsManager);

  await plans.generate(model);

  const highlighter = components.get(OBF.Highlighter);
  //highlighter.setup({ world });

  const cullers = components.get(OBC.Cullers);
  const culler = cullers.create(world);
  for (const fragment of model.items) {
    culler.add(fragment.mesh);
  }

  culler.needsUpdate = true;

  world.camera.controls.addEventListener("sleep", () => {
    culler.needsUpdate = true;
  });

  const classifier = components.get(OBC.Classifier);
  const edges = components.get(OBF.ClipEdges);

  classifier.byModel(model.uuid, model);
  classifier.byEntity(model);

  const modelItems = classifier.find({ models: [model.uuid] });

  const thickItems = classifier.find({
    entities: ["IFCWALLSTANDARDCASE", "IFCWALL"],
  });

  const thinItems = classifier.find({
    entities: ["IFCDOOR", "IFCWINDOW", "IFCPLATE", "IFCMEMBER"],
  });

  const grayFill = new THREE.MeshBasicMaterial({ color: "gray", side: 2 });
  const blackLine = new THREE.LineBasicMaterial({ color: "black" });
  const blackOutline = new THREE.MeshBasicMaterial({
    color: "black",
    opacity: 0.5,
    side: 2,
    transparent: true,
  });

  edges.styles.create(
    "thick",
    new Set(),
    world,
    blackLine,
    grayFill,
    blackOutline,
  );

  for (const fragID in thickItems) {
    const foundFrag = fragments.list.get(fragID);
    if (!foundFrag) continue;
    const { mesh } = foundFrag;
    edges.styles.list.thick.fragments[fragID] = new Set(thickItems[fragID]);
    edges.styles.list.thick.meshes.add(mesh);
  }

  edges.styles.create("thin", new Set(), world);

  for (const fragID in thinItems) {
    const foundFrag = fragments.list.get(fragID);
    if (!foundFrag) continue;
    const { mesh } = foundFrag;
    edges.styles.list.thin.fragments[fragID] = new Set(thinItems[fragID]);
    edges.styles.list.thin.meshes.add(mesh);
  }

  await edges.update(true);

  const panel = BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
    <bim-panel-section active label="Planos" class="options-menu" icon="simple-icons:flatpak">
        <bim-panel-section name="floorPlans" label="Plantas">
        </bim-panel-section>
      </bim-panel-section>
      `;
  });



  const minGloss = world.renderer!.postproduction.customEffects.minGloss;

  const whiteColor = new THREE.Color("white");

  const panelSection = panel.querySelector(
    "bim-panel-section[name='floorPlans']",
  ) as BUI.PanelSection;

  for (const plan of plans.list) {
    const planButton = BUI.Component.create<BUI.Checkbox>(() => {
      return BUI.html`
        <bim-button checked label="${plan.name}"
          @click="${() => {
          world.renderer!.postproduction.customEffects.minGloss = 0.1;
          highlighter.backupColor = whiteColor;
          classifier.setColor(modelItems, whiteColor);
          world.scene.three.background = whiteColor;
          plans.goTo(plan.id);
          culler.needsUpdate = true;
        }}">
        </bim-button>
      `;
    });
    panelSection.append(planButton);
  }


  const defaultBackground = world.scene.three.background;

  const exitButton = BUI.Component.create<BUI.Checkbox>(() => {
    return BUI.html`
        <bim-button checked label="Exit"
          @click="${() => {
        highlighter.backupColor = null;
        highlighter.clear();
        world.renderer!.postproduction.customEffects.minGloss = minGloss;
        classifier.resetColor(modelItems);
        world.scene.three.background = defaultBackground;
        plans.exitPlanView();
        culler.needsUpdate = true;
      }}">
        </bim-button>
      `;
  });

  panelSection.append(exitButton);

  //BUI.Manager.init();
return panel;

};
