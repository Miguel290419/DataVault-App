declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    executeSql: (
      sqlStatement: string,
      params?: any[]
    ) => Promise<[any, any]>;
    close: () => Promise<void>;
  }

  export function openDatabase(options: {
    name: string;
    location: string;
  }): Promise<SQLiteDatabase>;

  export function enablePromise(enable: boolean): void;
}