var u=Object.defineProperty,f=Object.defineProperties;var v=Object.getOwnPropertyDescriptors;var n=Object.getOwnPropertySymbols;var h=Object.prototype.hasOwnProperty,P=Object.prototype.propertyIsEnumerable;var i=(s,e,t)=>e in s?u(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t,c=(s,e)=>{for(var t in e||(e={}))h.call(e,t)&&i(s,t,e[t]);if(n)for(var t of n(e))P.call(e,t)&&i(s,t,e[t]);return s},m=(s,e)=>f(s,v(e));import{d as L,m as $,a as g,B as d,o as r,c as a,D as l,F as w,M as B,e as b}from"./vendor.88f98271.js";import{P as j}from"./PlayerBicon.7948e8a8.js";import{_ as k}from"./index.f023f093.js";const x=L({name:"LeaderboardView",components:{Player:j},computed:m(c({},$(["getPlayers"])),{playersList(){return this.getPlayers.slice(0,10)}}),async mounted(){await this.$store.dispatch("setTopPlayers")}}),D={class:"container"},C={"transition-duration":"0.3s","item-selector":".item","fit-width":"true",class:"m-auto"};function F(s,e,t,V,z,E){const p=g("player"),_=d("masonry-tile"),y=d("masonry");return r(),a("div",D,[l((r(),a("div",C,[(r(!0),a(w,null,B(s.playersList,o=>l((r(),a("div",{key:o.name,class:"item p-lg-3 p-md-2 mb-2"},[b(p,{size:"md",player:o},null,8,["player"])])),[[_]])),128))])),[[y]])])}var q=k(x,[["render",F]]);export{q as default};
