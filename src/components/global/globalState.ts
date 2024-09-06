// GlobalState.ts
export class GlobalState {
    private static instance: GlobalState;
    private _ifcFileArray: Uint8Array | null = null;
  
    private constructor() {}
  
    public static getInstance(): GlobalState {
      if (!GlobalState.instance) {
        GlobalState.instance = new GlobalState();
      }
      return GlobalState.instance;
    }
  
    public setIfcFileArray(fileArray: Uint8Array | null): void {
      this._ifcFileArray = fileArray;
    }
  
    public getIfcFileArray(): Uint8Array | null {
      return this._ifcFileArray;
    }
  }