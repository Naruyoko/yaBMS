var Node=function Node(id,matrix,parent){
  if (!(this instanceof Node)) return new Node(id,matrix,parent);
  this.id=id;
  this.parent=parent;
  this.matrix=matrix+"";
  this.children=[];
  this.childrenN=0;
  this.node=Node.createDOM(this.id,this.matrix);
  Node.nodesByMatrix.set(this.matrix,this.id);
  if (Node.nodesWithMirrorsByMatrix.has(this.matrix)) Node.nodesWithMirrorsByMatrix.get(this.matrix).push(this.id);
  else Node.nodesWithMirrorsByMatrix.set(this.matrix,[this.id]);
  Node.nodes[this.id]=this;
}
Node.createDOM=function (id,matrix){
  var div=document.createElement('div');
  div.setAttribute("id","node"+id);
  div.setAttribute("class","node");

  var span=document.createElement('span');
  span.setAttribute("id","bms"+id);
  span.innerHTML=matrix;
  div.appendChild(span);

  var inputdiv=document.createElement('div');
  inputdiv.setAttribute("id","buttons"+id);
  inputdiv.setAttribute("class","buttoncontainer");
  div.appendChild(inputdiv);

  if (matrix&&matrix!=Node.LEAST){
    var inputplus=document.createElement('input');
    inputplus.setAttribute("type","button");
    inputplus.setAttribute("value","expand");
    inputplus.setAttribute("onclick","javascript:Node.nodes["+id+"].addChild();");
    inputplus.setAttribute("class","nodebutton");
    inputdiv.appendChild(inputplus);

    var inputminus=document.createElement('input');
    inputminus.setAttribute("type","button");
    inputminus.setAttribute("value","retract");
    inputminus.setAttribute("onclick","javascript:Node.nodes["+id+"].removeChild();");
    inputminus.setAttribute("class","nodebutton");
    inputdiv.appendChild(inputminus);
  }

  var childdiv=document.createElement('div');
  childdiv.setAttribute("id","children"+id);
  childdiv.setAttribute("class","childrencontainer");
  div.appendChild(childdiv);

  return div;
}
Node.prototype.addChild=function (){
  if (!this.matrix||this.matrix==Node.LEAST) return;
  if (this.childrenN==this.children.length){
    var isStandardPath,expansion;
    if (this.matrix==Node.LIMIT){
      isStandardPath=true;
      expansion=this.childrenN==0?"(0)(1)":"("+"0,".repeat(this.childrenN)+"0)("+"1,".repeat(this.childrenN)+"1)";
    }else{
      var b=new Bms(this.matrix);
      b.b=this.childrenN;
      var newMatrix=b.expand().toStringWithEmptyRowRemoved().split("[")[0];
      if (this.childrenN==0||this.children[this.childrenN-1].matrix!=newMatrix) expansion=newMatrix;
      else return;
      var ancestorNode=this;
      while (ancestorNode){
        if (ancestorNode.matrix==Node.LIMIT){
          isStandardPath=true;
          break;
        }
        var p=ancestorNode.parent;
        if (p&&p.children.indexOf(ancestorNode)>0&&Bms.lte(newMatrix,p.children[p.children.indexOf(ancestorNode)-1].matrix)){
          isStandardPath=false;
          break;
        }
        ancestorNode=p;
      }
    }
    if (isStandardPath) this.children.push(Node(Node.nodeN++,expansion,this));
    else this.children.push(Node.mirror(Node.nodeN++,expansion,this));
  }
  document.getElementById("children"+this.id).appendChild(this.children[this.childrenN].node);
  this.childrenN++;
  this.update();
}
Node.prototype.removeChild=function (){
  if (this.childrenN<=0) return;
  this.childrenN--;
  document.getElementById("children"+this.id).removeChild(this.children[this.childrenN].node);
}
Node.prototype.update=function (){
  var ids=Node.nodesWithMirrorsByMatrix.get(this.matrix);
  for (var i=0;i<ids.length;i++){
    var node=Node.nodes[ids[i]];
  }
}
Node.nodes=[]
Node.nodesByMatrix=new Map();
Node.nodesWithMirrorsByMatrix=new Map();
Node.nodeN=0;
Node.mirror=function (id,matrix,parent){
  if (!(this instanceof Node.mirror)) return new Node.mirror(id,matrix,parent);
  this.id=id;
  this.parent=this.parent;
  this.matrix=matrix+"";
  this.node=Node.mirror.createDOM(this.id,this.matrix);
  if (Node.nodesWithMirrorsByMatrix.has(this.matrix)) Node.nodesWithMirrorsByMatrix.get(this.matrix).push(this.id);
  else Node.nodesWithMirrorsByMatrix.set(this.matrix,[this.id]);
  Node.nodes[this.id]=this;
}
Node.mirror.createDOM=function (id,matrix){
  var div=document.createElement('div');
  div.setAttribute("id","node"+id);
  div.setAttribute("class","node");

  var span=document.createElement('span');
  span.setAttribute("id","bms"+id);
  span.innerHTML=matrix;
  div.appendChild(span);

  var inputdiv=document.createElement('div');
  inputdiv.setAttribute("id","buttons"+id);
  inputdiv.setAttribute("class","buttoncontainer");
  div.appendChild(inputdiv);

  var inputscroll=document.createElement('input');
  inputscroll.setAttribute("type","button");
  inputscroll.setAttribute("value","go to original");
  inputscroll.setAttribute("onclick","javascript:document.getElementById(\"bms\"+Node.nodesByMatrix.get(\""+matrix+"\")).scrollIntoView();");
  inputscroll.setAttribute("class","nodebutton");
  inputdiv.appendChild(inputscroll);

  return div;
}
Node.LEAST="()";
Node.LIMIT="limit";
var treecontainer;
var expandbutton=function(no){
  var pnode=document.getElementById("node"+no);
  var pbmsstr=document.getElementById("bms"+no).innerHTML;
  if(pnode!==null){
  }else{
    console.log("You Died");
  }
}
window.onload=function (){
  treecontainer=document.getElementById("treecontainer");
  treecontainer.appendChild(Node(Node.nodeN++,Node.LIMIT,null).node);
}