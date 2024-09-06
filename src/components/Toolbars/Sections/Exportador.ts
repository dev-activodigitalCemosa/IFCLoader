import * as BUI from "@thatopen/ui";
import { GlobalState } from '../../global/globalState';

export default () => {
    // Cargar Pyodide y ejecutar el script Python
    const ejecutarScriptPython = async () => {
        // Cargar Pyodide
        const pyodide = await loadPyodide();
        await pyodide.loadPackage(["numpy", "pandas","tqdm"]);
        await pyodide.loadPackage("micropip");
        const micropip = pyodide.pyimport("micropip");
        await micropip.install('https://dev-activodigitalcemosa.github.io/ExportIFCToExcel/IfcOpenShell-0.7.0-py3-none-any.whl');
        await micropip.install('https://dev-activodigitalcemosa.github.io/ExportIFCToExcel/openpyxl-3.1.5-py2.py3-none-any.whl');
        const ifcFileArray = GlobalState.getInstance().getIfcFileArray();
        pyodide.FS.writeFile('/tmp/model.ifc', ifcFileArray);

        // Definir el código Python que deseas ejecutar
        const pythonCode = `
import ifcopenshell
import ifcopenshell.util
import ifcopenshell.geom
import ifcopenshell.util.element
import ifcopenshell.util.placement
import os
import pandas as pd
from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.worksheet.table import Table, TableStyleInfo
from datetime import datetime
import re
import logging

logging.basicConfig(filename='app.log', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def get_entities_filtered(ifcschema_entities, get_types):
    ents_not_collect = ["IfcColumn"]
    if get_types:
        ents = [e for e in ifcschema_entities if "type" in e.lower()]
    else:
        ents = [e for e in ifcschema_entities if "type" not in e.lower() and e in ents_not_collect]
    return (len(ents), ents)

def get_ents_info_to_df(ifc_file, ifc_entName):
    fields_to_exclude = ['Description','ObjectPlacement','Representation']
    entities = ifc_file.by_type(ifc_entName)
    entity_info = [en.get_info() for en in entities]
    entity_container = [ifcopenshell.util.element.get_container(en) for en in entities]
    entity_coord = [ifcopenshell.util.placement.get_local_placement(en.ObjectPlacement)[:,3][:3] for en in entities]
    entity_properties = []
    for en in entities:
        props = ifcopenshell.util.element.get_psets(en)
        filtered_props = {key: value for key, value in props.items() if 'ADIF' in key}
        entity_properties.append(filtered_props)
    df_info = pd.DataFrame(entity_info)
    df_props_expanded = pd.json_normalize(entity_properties)
    df_container = pd.DataFrame(entity_container, columns=['Location'])
    df_coord = pd.DataFrame(entity_coord, columns=['X', 'Y', 'Z'])
    if fields_to_exclude:
        existing_fields = [col for col in df_info.columns if col not in fields_to_exclude]
        df_info = df_info[existing_fields]
    combined_df = pd.concat([df_info, df_props_expanded, df_container, df_coord], axis=1)
    return combined_df

def contract_entName(entName, trunc_n=3):
    entName_split = re.findall('[A-Z][^A-Z]*', entName)
    return "".join([s[:trunc_n] if len(s) >= trunc_n else s for s in entName_split])

def create_ws(wb, ws_name):
    if ws_name in wb.sheetnames:
        ws = wb.create_sheet(title=ws_name + "_1")
    else:
        ws = wb.create_sheet(title=ws_name)
    return ws

def create_ws_and_table(wb, ifc_entName, table_suffix_counter={}):
    df = get_ents_info_to_df(ifc_file, ifc_entName)
    if len(ifc_entName) > 20:
        ifc_entName = contract_entName(ifc_entName, trunc_n=3)
    ws = create_ws(wb, ifc_entName)
    if not df.empty:
        if isinstance(df.columns, pd.MultiIndex):
            for col_num, (level1, _) in enumerate(df.columns, start=1):
                ws.cell(row=1, column=col_num, value=str(level1) if level1 else '')
            for col_num, (_, level2) in enumerate(df.columns, start=1):
                ws.cell(row=2, column=col_num, value=str(level2) if level2 else '')
        else:
            for col_num, col_name in enumerate(df.columns, start=1):
                ws.cell(row=1, column=col_num, value=str(col_name))
        for row in dataframe_to_rows(df, index=False, header=False):
            ws.append([str(v) if str(v).startswith('#') or '(' in str(v) else v for v in row])
        df_shape = df.shape
        last_column_letter = get_excel_column_letter(df_shape[1]-1)
        tbl_xl_rangeAddress = f"A1:{last_column_letter}{df_shape[0] + 2}"
        if not re.match(r'^[A-Z]{1,3}\d+:[A-Z]{1,3}\d+$', tbl_xl_rangeAddress):
            raise ValueError(f"Invalid range address generated: {tbl_xl_rangeAddress}")
        base_table_name = ifc_entName
        suffix = table_suffix_counter.get(base_table_name, 0)
        unique_table_name = f"{base_table_name}_{suffix}"
        table_suffix_counter[base_table_name] = suffix + 1
        tbl = Table(displayName=unique_table_name, ref=tbl_xl_rangeAddress)
        style = TableStyleInfo(name="TableStyleMedium9", showFirstColumn=False, showLastColumn=False, showRowStripes=True, showColumnStripes=True)
        tbl.tableStyleInfo = style
        ws.add_table(tbl)
    return True

def remove_ws(wb, ws_name="Sheet"):
    if ws_name in wb.sheetnames:
        ws_to_delete = wb[ws_name]
        wb.remove(ws_to_delete)

def purge_wb(wb):
    for ws in wb.sheetnames:
        ws = wb[ws]
    for tbl in ws.tables.values(): ws._tables.remove(tbl)
    remove_ws(wb, ws_name=ws)
    return True

def get_excel_column_letter(n):
    string = ""
    while n >= 0:
        n, remainder = divmod(n, 26)
        string = chr(65 + remainder) + string
        n -= 1
    return string

def process_ifc_file(ifc_path, destination_folder, ifc_getTypes):
    logging.info("Inicio del procesamiento")
    try:
        if not ifc_path or not destination_folder:
            print("Error: Seleccione un archivo IFC y una carpeta de destino antes de continuar.")
            return
        global ifc_file
        ifc_file = ifcopenshell.open(ifc_path)
        sch_entities_names = [e.name() for e in ifcopenshell.schema_by_name(ifc_file.schema).entities()]
        entities_names_in_use = []
        for en in sch_entities_names:
            try:
                if len(ifc_file.by_type(en)) != 0:
                    entities_names_in_use.append(en)
            except RuntimeError as e:
                print(f"Advertencia: {e} - Entidad '{en}' ignorada.")
        ents = get_entities_filtered(entities_names_in_use, get_types=ifc_getTypes)
        print (ents)
        xls_filename = os.path.join(destination_folder, datetime.now().strftime("%Y-%m-%d") + f"_{os.path.basename(ifc_path).split('.')[0]}_entTypes_{str(ifc_getTypes)}_2.xlsx")
        wb = Workbook()
        purge_wb(wb)
        table_suffix_counter = {}
        for i, en in enumerate(ents[1]):
            print(f"Procesando entidad: {en} ({i+1}/{len(ents[1])})")
            create_ws_and_table(wb, en, table_suffix_counter)
        remove_ws(wb, ws_name="Sheet")
        wb.save(xls_filename)
        print(f"Archivo {xls_filename} ha sido guardado exitosamente!")
    except Exception as e:
        logging.error(f"Error durante el procesamiento: {str(e)}")
        print(f"Error durante el procesamiento: {str(e)}")

# Entradas del usuario
if __name__ == "__main__":
    ifc_path = "/tmp/model.ifc"
    destination_folder = "/tmp"
    ifc_getTypes = False
    process_ifc_file(ifc_path, destination_folder, ifc_getTypes)
        `;

        // Ejecutar el script Python usando Pyodide
        try {
            const result = await pyodide.runPythonAsync(pythonCode);
            console.log(`Salida: ${result}`);
        } catch (error) {
            console.error(`Error al ejecutar Python: ${error}`);
        }
    };

    const loadExporter = async () => {
        ejecutarScriptPython(); // Llama a la función cuando se hace clic en el botón
    };

    return BUI.Component.create<BUI.PanelSection>(() => {
        return BUI.html`
            <bim-toolbar-section label="Exportar" icon="solar:import-bold">
            <bim-button @click=${loadExporter} label="IFC Sharepoint" icon="mdi:microsoft-sharepoint" tooltip-title="Cargar IFC desde Sharepoint"
          tooltip-text="Abre el explorador de bibliotecas de Sharepoint"></bim-button>
                
            </bim-toolbar-section>
        `;
    });
};

// Cargar Pyodide desde el CDN
async function loadPyodide() {
    const pyodideScript = document.createElement('script');
    pyodideScript.src = "https://cdn.jsdelivr.net/pyodide/v0.22.0a1/full/pyodide.js";
    document.head.appendChild(pyodideScript);

    // Esperar a que el script se cargue
    await new Promise<void>((resolve) => {
        pyodideScript.onload = () => resolve();
    });

    // @ts-ignore - pyodide está definido globalmente después de cargar el script
    return await window['loadPyodide']();
}