import { Vector } from "p5";

export function inRect(pos:Vector,leftTop:Vector,rightBottom:Vector):boolean{
    if(pos.x>=leftTop.x && pos.x<=rightBottom.x&&pos.y>=leftTop.y &&pos.y<=rightBottom.y) return  true;
    return false;
}
export function isNumber(value: string | number): boolean
{
   return ((value != null) &&
           (value !== '') &&
           !isNaN(Number(value.toString())));
}