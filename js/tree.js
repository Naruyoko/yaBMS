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

  var inputtoggleanalysis=document.createElement('input');
  inputtoggleanalysis.setAttribute("type","button");
  inputtoggleanalysis.setAttribute("value","analysis");
  inputtoggleanalysis.setAttribute("onclick","javascript:Node.nodes["+id+"].toggleAnalysis();");
  inputtoggleanalysis.setAttribute("class","nodebutton");
  inputdiv.appendChild(inputtoggleanalysis);

  var childdiv=document.createElement('div');
  childdiv.setAttribute("id","children"+id);
  childdiv.setAttribute("class","childrencontainer");
  div.appendChild(childdiv);

  var analysisp=document.createElement('p');
  analysisp.setAttribute("id","analysiscontainer"+id);
  analysisp.setAttribute("style","display:none");
  div.appendChild(analysisp);

  var analysisul=document.createElement('ul');
  analysisul.setAttribute("id","analysis"+id);
  analysisp.appendChild(analysisul);

  var analysisoutercontainer=document.createElement('div');
  analysisp.appendChild(analysisoutercontainer);

  var analysisinputadd=document.createElement('input');
  analysisinputadd.setAttribute("type","button");
  analysisinputadd.setAttribute("value","Add");
  analysisinputadd.setAttribute("onclick","javascript:Node.nodes["+id+"].addAnalysis();");
  analysisoutercontainer.appendChild(analysisinputadd);

  return div;
}
Node.prototype.addChild=function (){
  if (!this.matrix||this.matrix==Node.LEAST) return;
  if (this.childrenN==this.children.length){
    var isStandardPath,expansion;
    if (this.matrix==Node.LIMIT){
      isStandardPath=true;
      expansion=this.childrenN==0?"(0)(1)":"("+"0,".repeat(this.childrenN)+"0)("+"1,".repeat(this.childrenN)+"1)";
    }else if (this.matrix=="(0)"){
      if (this.childrenN>=1) return;
      isStandardPath=true;
      expansion=Node.LEAST;
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
Node.prototype.toggleAnalysis=function (){
  var analysisp=document.getElementById("analysiscontainer"+this.id);
  analysisp.setAttribute("style",analysisp.getAttribute("style")?"":"display:none");
  if (!analysisp.getAttribute("style")) this.update();
}
Node.prototype.addAnalysis=function (){
  var availableOptions=["new","cancel"];
  var data=analysisData.get(this.matrix);
  for (var i=0;i<notations.length;i++){
    if (!data||data[notations[i]]===undefined||data[notations[i]]===null){
      availableOptions.push(notations[i]);
    }
  }
  var selection;
  do{
    selection=prompt(availableOptions.join(", "));
    if (selection===null) return;
  }while (availableOptions.indexOf(selection)==-1);
  if (selection=="cancel") return;
  if (selection=="new"){
    var newNotation;
    do{
      newNotation=prompt("The name of the new notation?");
      if (newNotation===null) return;
    }while(!newNotation||notations.indexOf(newNotation)!=-1);
    if (newNotation=="cancel") return;
    selection=newNotation;
    notations.push(selection);
  }
  if (!data){
    data={};
    analysisData.set(this.matrix,data);
  }
  data[selection]=prompt("Value?","")||"";
  this.updateAll();
}
Node.prototype.editAnalysis=function (notationid){
  var data=analysisData.get(this.matrix);
  var newValue=prompt("Editing analysis for "+notations[notationid],data[notations[notationid]]);
  if (newValue===null) return;
  data[notations[notationid]]=newValue;
  this.updateAll();
}
Node.prototype.removeAnalysis=function (notationid){
  if (!confirm("Are you sure?")) return;
  var data=analysisData.get(this.matrix);
  data[notations[notationid]]=null;
  for (var i=0;i<notations.length;i++){
    if (data[notations[i]]!==undefined||data[notations[i]]!==null) break;
  }
  if (i==notations.length) analysisData.set(this.matrix,null);
  this.updateAll();
}
Node.prototype.update=function (){
  var analysisp=document.getElementById("analysis"+this.id);
  analysisp.innerHTML="";
  var data=analysisData.get(this.matrix);
  if (data){
    for (var i=0;i<notations.length;i++){
      if (data[notations[i]]===undefined||data[notations[i]]===null) continue;
      var item=document.createElement('li');
      analysisp.appendChild(item);
      var itemcontent=document.createElement('span');
      itemcontent.textContent=notations[i]+" - "+data[notations[i]];
      itemcontent.setAttribute("class","analysiscontent");
      item.appendChild(itemcontent);
      var iteminputedit=document.createElement('input');
      iteminputedit.setAttribute("type","button");
      iteminputedit.setAttribute("value","Edit");
      iteminputedit.setAttribute("onclick","javascript:Node.nodes["+this.id+"].editAnalysis("+i+");");
      item.appendChild(iteminputedit);
      var iteminputremove=document.createElement('input');
      iteminputremove.setAttribute("type","button");
      iteminputremove.setAttribute("value","Remove");
      iteminputremove.setAttribute("onclick","javascript:Node.nodes["+this.id+"].removeAnalysis("+i+");");
      item.appendChild(iteminputremove);
    }
  }
}
Node.prototype.updateAll=function (){
  var ids=Node.nodesWithMirrorsByMatrix.get(this.matrix);
  for (var i=0;i<ids.length;i++){
    var node=Node.nodes[ids[i]];
    node.update();
  }
}
Node.nodes=[];
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
  inputscroll.setAttribute("onclick","javascript:searchByMatrix(\""+matrix+"\");");
  inputscroll.setAttribute("class","nodebutton");
  inputdiv.appendChild(inputscroll);

  var inputtoggleanalysis=document.createElement('input');
  inputtoggleanalysis.setAttribute("type","button");
  inputtoggleanalysis.setAttribute("value","analysis");
  inputtoggleanalysis.setAttribute("onclick","javascript:Node.nodes["+id+"].toggleAnalysis();");
  inputtoggleanalysis.setAttribute("class","nodebutton");
  inputdiv.appendChild(inputtoggleanalysis);

  var analysisp=document.createElement('p');
  analysisp.setAttribute("id","analysiscontainer"+id);
  analysisp.setAttribute("style","display:none");
  div.appendChild(analysisp);

  var analysisul=document.createElement('ul');
  analysisul.setAttribute("id","analysis"+id);
  analysisp.appendChild(analysisul);

  return div;
}
Node.mirror.prototype.update=function (){
  var analysisp=document.getElementById("analysis"+this.id);
  analysisp.innerHTML="";
  var data=analysisData.get(this.matrix);
  if (data){
    for (var i=0;i<notations.length;i++){
      if (data[notations[i]]===undefined||data[notations[i]]===null) continue;
      var item=document.createElement('li');
      analysisp.appendChild(item);
      var itemcontent=document.createElement('span');
      itemcontent.textContent=notations[i]+" - "+data[notations[i]];
      itemcontent.setAttribute("class","analysiscontent");
      item.appendChild(itemcontent);
    }
  }
}
Node.mirror.prototype.toggleAnalysis=Node.prototype.toggleAnalysis;
Node.LEAST="\u03b5";
Node.LIMIT="limit";

var searchByMatrix=function (matrix){
  if (matrix===undefined) matrix=document.getElementById("searchByMatrixInput").value;
  if (!matrix) matrix=Node.LEAST;
  if (!/^(\u03b5|(\(\d+(,\d+)*\))+)$/.test(matrix)) return;
  var path;
  if (matrix==Node.LEAST){
    path=[0,0,0];
  }else{
    var lastMatrix=Node.LIMIT;
    path=[];
    while (true){
      var expansion;
      var n=0;
      while (true){
        if (lastMatrix==Node.LIMIT){
          expansion=n==0?"(0)(1)":"("+"0,".repeat(n)+"0)("+"1,".repeat(n)+"1)";
        }else{
          var b=new Bms(lastMatrix);
          b.b=n;
          expansion=b.expand().toStringWithEmptyRowRemoved().split("[")[0];
        }
        if (Bms.lte(matrix,expansion)) break;
        if (new Bms(matrix).Lng()<=new Bms(expansion).Lng()) return;
        n++;
      }
      path.push(n);
      lastMatrix=expansion;
      if (Bms.eq(matrix,expansion)) break;
    }
  }
  searchByIndex(path);
}
var searchByIndex=function (index){
  if (index===undefined) index=document.getElementById("searchByIndexInput").value;
  if (typeof index=="string"&&!/^(|\d(,\d)*)$/.test(index)) return;
  if (typeof index=="string") index=index.split(",");
  var lastNode=Node.nodes[0];
  for (var i=0;i<index.length;i++){
    while (lastNode.childrenN<=index[i]) lastNode.addChild();
    lastNode=lastNode.children[index[i]];
  }
  lastNode.node.scrollIntoView();
}

var notations=[];
var analysisData=new Map();

var treecontainer;
var rightsidecontent;
var toggleRightsideMenu=function (){
  rightsidecontent.setAttribute("style",rightsidecontent.getAttribute("style")?"":"display:none");
}
window.onload=function (){
  treecontainer=document.getElementById("treecontainer");
  treecontainer.appendChild(Node(Node.nodeN++,Node.LIMIT,null).node);
  rightsidecontent=document.getElementById("rightsidecontent");
  toggleRightsideMenu();
}