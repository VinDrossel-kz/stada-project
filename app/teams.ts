export const names=['Kokshetau','Okzhetpes','Bolektau','Burabay','Altai','Alatau','Tien Shan','Khan Tengri','Belukha','Everest','K2','Annapurna','Elbrus','Mont Blanc'];
export type Team={id:number;name:string;score:number;updated_at:string|null};
export const initialTeams:Team[]=names.map((name,i)=>({id:i+1,name,score:0,updated_at:null}));
