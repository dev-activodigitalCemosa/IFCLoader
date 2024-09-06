# Visor IFC

## Instalación

Requisitos Previos
Antes de instalar el proyecto, asegúrate de tener instalados los siguientes programas:

- Node.js (versión 14.x o superior)
- npm (incluido con Node.js)
- Un gestor de paquetes como Yarn (opcional, pero recomendado)

Pasos de Instalación
- Clona el repositorio del proyecto desde GitHub:

```bash
git clone https://github.com/tu_usuario/tu_repositorio.git
```
- Navega al directorio del proyecto y ejecuta el siguiente comando para instalar las dependencias necesarias:

```bash
cd tu_repositorio
npm install
```
O, si estás usando Yarn:

```bash
yarn install
```

- Compilar el proyecto para desarrollo o producción:

```bash
- Para desarrollo:
npm run dev

- Para producción:
npm run build
```
## Descripción General
El proyecto es una aplicación de visualización 3D de archivos IFC (Industry Foundation Classes) mediante el uso de la libreria __@thatopen__. La aplicación utiliza varios paneles y una barra de herraminetas para proporcionar funcionalidades como selección de elementos, importación de modelos, visualización de planos 2D, manejo de visibilidad, mediciones etc...

## Resumen de Funcionalidades

Importación
- __Cargar IFC:__ Permite cargar archivos IFC para integrarlos en el modelo 3D. Utiliza un botón para seleccionar el archivo y carga el modelo en la escena.
- __Cargar Fragmentos:__(En desarrollo) Permite importar fragmentos preconvertidos desde un archivo ZIP, que incluye geometría y propiedades del modelo.
- __Cargar Tiles:__ (En desarrollo) Carga archivos de "tiles" que contienen modelos convertidos para mejorar el rendimiento en modelos grandes.
- __Cargar desde SharePoint:__ Abre un explorador para seleccionar y cargar archivos IFC directamente desde SharePoint.

Proyecto
- __Modelos cargados:__ Permite ver los modelos que se encuentran cargados, incluye 3 botónes para ocultar el modelo completo, descargarlo en local o eliminarlo de la escena
- __Árbol de propiedades:__ Permite ver un despliegue de todas las entidades que conforman al modelo, seleccionarlas para ver sus propiedades y que se resalten en escena y ocultarlas.
- __Selección personalizada:__ Permite guardar una selección de entidades personalizada.

Navegación
- __Modo de Navegación:__ Permite cambiar entre diferentes modos de navegación, incluyendo "Orbit" y "FirstPerson".
- __Proyección de la Cámara:__ Alterna entre proyección perspectiva y ortográfica.
- __Centrar Modelo:__ Ajusta la cámara para encajar el modelo completo en la vista.
- __Bloquear/Desbloquear Cámara:__ Activa o desactiva la capacidad de mover la cámara.

Medidas
- __Medir Longitud:__ Herramienta para medir distancias entre dos puntos en el modelo 3D.
- __Medir Área:__ Herramienta para medir áreas de superficies en el modelo 3D.
- __Medir Volumen:__ Herramienta para medir volúmenes dentro del modelo 3D.
- __Borrar Mediciones:__ Limpia todas las mediciones realizadas.

Cortes
-__Habilitar Cortes:__ Activa o desactiva la herramienta de cortes en el modelo.
-__Cortes Visibles:__ Muestra u oculta los planos de corte en la vista.
-__Color del Plano:__ Ajusta el color del plano de corte.
-__Opacidad del Plano:__ Ajusta la opacidad del plano de corte.
-__Tamaño del Plano:__ Modifica el tamaño del plano de corte.
-__Borrar Todo:__ Elimina todos los cortes aplicados al modelo.

Planos 2D
- __Visualizar Planos 2D:__ Muestra planos 2D del modelo para facilitar la visualización de diferentes secciones.
- __Navegar entre Planos:__ Permite seleccionar y cambiar entre diferentes planos.
- __Salir de Vista de Plano:__ Regresa a la vista 3D del modelo.

Selección
- __Mostrar Todo:__ Muestra todos los elementos del modelo 3D.
- __Ocultar Seleccionado:__ Alterna la visibilidad de los elementos seleccionados.
- __Aislar Seleccionado:__ Oculta todos los elementos no seleccionados para enfocarse solo en la selección actual.
- __Zoom en Selección:__ Ajusta la cámara para enfocar los elementos seleccionados.

Tema
- __Permite cambiar el tema:__ claro, oscuro o el predeterminado por tu sistema.

## Archivos principales

__Archivo Principal (main.ts)__
El archivo principal configura la aplicación, inicializa componentes y maneja eventos.

Funciones Clave:
Configuración de Componentes:

Inicializa los componentes necesarios para la visualización, como IfcLoader, FragmentsManager, Highlighter, etc.
Manejo de Eventos:

Configura eventos para la carga de archivos IFC y la actualización de la interfaz de usuario.
Creación de Paneles:

Configura y muestra los paneles de la aplicación, como los paneles de selección, importación, medidas, etc.

__Panel de Selección (Selection.ts)__
Este panel permite a los usuarios ver y gestionar las propiedades de los elementos seleccionados en el modelo 3D.

Funciones Clave:
updatePropsTable(fragmentIdMap: OBC.FragmentIdMap)

Actualiza la tabla de propiedades cuando se seleccionan o deseleccionan fragmentos.
search(e: Event)

Filtra la tabla de propiedades según la consulta ingresada en el campo de búsqueda.
toggleExpanded()

Alterna la expansión de la tabla de propiedades.

__Importación (Import.ts)__
Esta sección de la barra de herraminetas permite a los usuarios cargar archivos IFC y fragmentos en la aplicación.

Funciones Clave:
LoadIfc(): Carga un archivo IFC desde el sistema de archivos y lo añade al escenario.

loadFragments(): (#No incluida)Carga fragmentos de un archivo ZIP y los añade a la aplicación.

loadTiles(): #(No incluida) Carga un archivo de tiles y lo utiliza para transmitir el modelo.

abrirModal(): Abre un modal para seleccionar un archivo desde SharePoint.
(Necesario integrar la app en un entorno de sharepoint)

__Panel de Planos 2D (Plans.ts)__
Este panel permite a los usuarios ver y gestionar planos 2D del modelo.

Funciones Clave:
loadPlansPanel(world, components, model)

Configura el panel para mostrar planos 2D y gestionar su visualización en el modelo.
onFitModel()

Ajusta la vista de la cámara para encajar el modelo completo en el campo de visión.
onLock(e: Event)

Bloquea o desbloquea el control de la cámara.
Panel de Deslección (deselectPanel.ts)
Este panel permite a los usuarios gestionar la visibilidad de los elementos seleccionados y enfocar la selección en la vista.

Funciones Clave:
onToggleVisibility()

Alterna la visibilidad de los elementos seleccionados.
onIsolate()

Aísla los elementos seleccionados, ocultando los demás.
onShowAll()

Muestra todos los elementos en el modelo.
onFocusSelection()

Enfoca la cámara en los elementos seleccionados.

__Panel de Navegación (Navigation.ts)__
Este panel permite a los usuarios controlar la navegación y proyección de la cámara en el modelo 3D.

Funciones Clave:
onFitModel()

Ajusta la vista de la cámara para encajar el modelo completo en el campo de visión.
onLock(e: Event)

Bloquea o desbloquea el control de la cámara.
@change en Dropdown de Modo de Navegación y Proyección

Cambia el modo de navegación y la proyección de la cámara según la selección del usuario.

__Panel de Medidas (Measurement.ts)__
Este panel permite a los usuarios medir longitudes, áreas y volúmenes en el modelo 3D.

Funciones Clave:
activateButton(buttonType: string)

Activa el tipo de medición seleccionado (longitud, área o volumen).
onLongitud()

Activa la medición de longitud y configura el evento de clic para crear mediciones de longitud.
onArea()

Activa la medición de área y configura el evento de clic para crear mediciones de área.
onVolume()

Activa la medición de volumen y configura el evento de clic para crear mediciones de volumen.
highlighter.events.select.onHighlight

Calcula el volumen de los fragmentos seleccionados y muestra el resultado.

__Panel de Cortes (Clipper.ts)__
Este panel permite a los usuarios gestionar y personalizar los cortes en el modelo 3D.

Funciones Clave:
activateButton(buttonType: string)
Descripción: Activa el tipo de medición seleccionado (longitud, área o volumen) y desactiva los demás.

container.ondblclick
Descripción: Crea un plano de corte en el modelo cuando se hace doble clic en el contenedor, si la herramienta de corte está habilitada.

window.onkeydown
Descripción: Permite eliminar planos de corte cuando se presiona la tecla "Delete" o "Backspace", si la herramienta de corte está habilitada.

<bim-checkbox label="Habilitar cortes" ...>
Descripción: Habilita o desactiva la herramienta de cortes.

<bim-checkbox label="Cortes visibles" ...>
Descripción: Controla la visibilidad de los planos de corte.

<bim-color-input label="Color del plano" ...>
Descripción: Cambia el color del plano de corte.

<bim-number-input slider step="0.01" label="Opacidad del plano" ...>
Descripción: Ajusta la opacidad del plano de corte.

<bim-number-input slider step="0.1" label="Tamaño del plano" ...>
Descripción: Modifica el tamaño del plano de corte.

<bim-button label="Borrar todo" ...>
Descripción: Elimina todos los planos de corte aplicados al modelo.












