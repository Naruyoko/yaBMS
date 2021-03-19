/* ---------------------------------------------------------
  Bashicu Matrix
  in: _s[c][r] = matrix, c=column index, r=row index 
  in: _b = bracket */
var Bms=function(_s,_b,_f){
  if(typeof(_s)=="string"){
    var b=Bms.parse(_s);
    this.s=b.s;
  }else{
    this.s=_s;
    if(!isNaN(_b)) this.b=_b;
    this.f=_f;
  }
};
/* ---------------------------------------------------------
  bms.incBracket() returns inclemented bracket */
Bms.prototype.incBracket=function(){
  if(!(this.f === undefined)){
    return this.f(b);
  }else{
    return this.b;
  }
};
/* ---------------------------------------------------------
  bms.expand() returns one step expanded matrix from bms */
Bms.prototype.expand=function(){
  var s=this.s;
  var xs=this.xs();
  var ys=this.ys();
  
  /* inclement bracket */
  var b1 = this.incBracket();
  var s1 = s.slice(0,xs-1); /* pop rightmost column */
  
  /* get bad root */
  var r=this.getBadRoot();
  if(r==-1) return new Bms(s1,b1,this.f); 
  /* delta = s[rightmost]-s[bad root] */
  var delta=sub(s[xs-1], s[r]);
  var lmnz=this.getLowermostNonzero(s[xs-1]); /* lowermost nonzero */
  for(var y=lmnz;y<ys;y++) delta[y]=0; /* */
  /* create new matrix -> s1 */
  var A=this.getAscension(); /* get ascension matrix */
  var bs=xs-r-1; /* number of columns of the bad parts */
  
  /* copy and ascension */
  for(var i=0;i<this.b;i++){
    for(var x=0;x<bs;x++){
      var da=new Array(ys);
      for(var y=0;y<ys;y++){
        da[y]=s[r+x][y]+delta[y]*A[x][y]*(i+1);
      }
      s1.push(da);
    }
  }
  return new Bms(s1,b1,this.f);
};
/* ---------------------------------------------------------
  bms.findParent(x,y) returns column index of parent of (x,y).
  It returns -1 when the parent of (x,y) cannot be found. */
Bms.prototype.getParent=function(x,y){
  var p = x; /* parent candidate */
  while(p>0){
    /* p = next */
    if(y!=0){
      p=this.getParent(p,y-1); /* try column of upper parent */
    }else{
      p=p-1; /* simply left */
    }
    if(p==-1)return p; /* parent is not found */
    if(this.s[p][y]<this.s[x][y]){ /* judge smaller */
      return p;
    }
  }
  return -1;
}
/* ---------------------------------------------------------
  bms.getBadRoot() returns column index of bad root of bms.
   It returns -1 when the parent of (x,y) cannot be found. */
Bms.prototype.getBadRoot=function(){
  /* x = rightmost column */
  var x=this.xs()-1;
  /* y = Lowermost Nonzero row of x */
  var y=this.getLowermostNonzero(this.s[x]);
  if(y==-1)return -1;
  return this.getParent(x,y);
}
/* ---------------------------------------------------------
  bms.getAscension() returns ascension matrix A[x][y] of bms. 
   A[x][y]==0 (x+r,y) is not ascended in copy
   A[x][y]==1 (x+r,y) is ascended in copy
   r=column index of the bad root
*/
Bms.prototype.getAscension=function(){
  var xs=this.xs();
  var ys=this.ys();
  var r = this.getBadRoot(); /* bad root */
  if(r==-1) return []; /* bad root is not found -> empty */
  var bs = xs-r-1; /* number of columns of the bad part */
  var A = Array.zeros([bs, ys]); /* init */
  for(var y=0;y<ys;y++){
    A[0][y]=1; /* bad root is ascended */
    for(var x=1;x<bs;x++){ /* x=column index of bad part */
      var p=this.getParent(x+r,y);
      if(p-r>=0 && A[p-r][y]==1) A[x][y]=1; /* propagate from parent */
    }
  }
  return A;
}
/* ---------------------------------------------------------
  bms.getLowermostNonzero(c) returns row index of the lowermost nonzero element of c. 
   if lowermost nonzero element of c is not found, it returns -1.*/
Bms.prototype.getLowermostNonzero=function(c){
  var y;
  for(y=c.length-1;y>=0;y--){
    if(c[y]>0) break;
  }
  return y;
}
/* ---------------------------------------------------------
  bms.xs() returns number of columns of bms. */
Bms.prototype.xs=function(){
  return this.s.length;
}
/* ---------------------------------------------------------
  bms.ys() returns number of rows of bms. */
Bms.prototype.ys=function(){
  return this.s[0].length;
}
/* ---------------------------------------------------------
  convert to string */
Bms.prototype.toString=function(){
  var str="";
  for(var c=0;c<this.xs();c++){
    str+="(";
    for(var r=0;r<this.ys();r++){
      str += this.s[c][r];
      if(r!=this.ys()-1)str += ",";
    }
    str+=")";
  }
  if(this.b!==undefined){
    str+="["+this.b+"]";
  }
  return str;
}
/* ---------------------------------------------------------
  Parse multiple matrices
  Bms.multiparse("(0,1,2)(3,4,5)\n(6,7,8)(9,10,11)")
= [ [ [0,1,2],[3,4,5]],[[6,7,8],[9,10,11]  ] ]  */
Bms.multiparse=function(str){
  var a=str.split("\n");
  var mm=new Array(a.length);
  for(var m=0;m<a.length;m++){
    mm[m]=Bms.parse(a[m]);
  }
  return mm;
}
/* ---------------------------------------------------------
  parse matrix from String
  parse("(0,1,2)(3,4,5)") = Bms([[0,1,2],[3,4,5] ]) */
Bms.parse=function(str){
  var s=[[]];
  //              1  2   3   4
  var r = /^(\s*\()(.*?)(\))(.*)/;
  var m=str.match(r);
  var ci=0;
  while(m!=null){
    var c=m[2].split(",");
    for(ri=0;ri<c.length;ri++){
      s[ci].push(parseInt(c[ri],10));
    }
    str=m[4];
    if(str=="")break;
    m=str.match(r);
    if(m!=null){
      s.push([]);
      ci++;
    }
  }
  var b;
  //                     1   2    3
  m=str.match(/(\[)([\s\d]*)(\])/);
  if(m!=null) b = parseInt(m[2]);
  if(s.dims==1){
    return new Bms([s],b); // primitive sequence
  }else{
    return new Bms(s,b);
  }
}

Bms.prototype.Lng=function(){
  return this.xs();
}
Bms.Lng=function(M){
  return M.xs();
}


Bms.prototype.getNonzeroHeight=function (){
  var ys=this.ys();
  while (ys>0){
    for (var i=0;i<this.xs()&&!this.s[i][ys-1];i++);
    if (i!=this.xs()) break;
    ys--;
  }
  return ys;
}
Bms.prototype.toStringWithEmptyRowRemoved=function(){
  var ys=this.getNonzeroHeight()||1;
  var str="";
  for(var c=0;c<this.xs();c++){
    str+="(";
    for(var r=0;r<ys;r++){
      str += this.s[c][r]||"0";
      if(r!=ys-1)str += ",";
    }
    str+=")";
  }
  if(this.b!==undefined){
    str+="["+this.b+"]";
  }
  return str;
}
Bms.prototype.compare=Bms.prototype.cmp=function (other){
  if (!(other instanceof Bms)) other=new Bms(other);
  var xs=Math.min(this.xs(),other.xs());
  var ys=Math.max(this.getNonzeroHeight(),other.getNonzeroHeight())
  for (var i=0;i<xs;i++){
    for (var j=0;j<ys;j++){
      if ((this.s[i][j]||0)<(other.s[i][j]||0)) return -1;
      if ((this.s[i][j]||0)>(other.s[i][j]||0)) return 1;
    }
  }
  if (this.xs()<other.xs()) return -1;
  if (this.xs()>other.xs()) return 1;
  return 0;
}
Bms.compare=Bms.cmp=function (x,y){
  if (!(x instanceof Bms)) x=new Bms(x);
  return x.cmp(y);
}
Bms.prototype.equal=Bms.prototype.eq=function (other){
  return this.cmp(other)==0;
}
Bms.equal=Bms.eq=function (x,y){
  if (!(x instanceof Bms)) x=new Bms(x);
  return x.eq(y);
}
Bms.prototype.notEqual=Bms.prototype.neq=function (other){
  return this.cmp(other)!=0;
}
Bms.notEqual=Bms.neq=function (x,y){
  if (!(x instanceof Bms)) x=new Bms(x);
  return x.neq(y);
}
Bms.prototype.lessThan=Bms.prototype.lt=function (other){
  return this.cmp(other)<0;
}
Bms.lessThan=Bms.lt=function (x,y){
  if (!(x instanceof Bms)) x=new Bms(x);
  return x.lt(y);
}
Bms.prototype.lessThanOrEqual=Bms.prototype.lte=function (other){
  return this.cmp(other)<=0;
}
Bms.lessThanOrEqual=Bms.lte=function (x,y){
  if (!(x instanceof Bms)) x=new Bms(x);
  return x.lte(y);
}
Bms.prototype.greaterThan=Bms.prototype.gt=function (other){
  return this.cmp(other)>0;
}
Bms.greaterThan=Bms.gt=function (x,y){
  if (!(x instanceof Bms)) x=new Bms(x);
  return x.gt(y);
}
Bms.prototype.greaterThanOrEqual=Bms.prototype.gte=function (other){
  return this.cmp(other)>=0;
}
Bms.greaterThanOrEqual=Bms.gte=function (x,y){
  if (!(x instanceof Bms)) x=new Bms(x);
  return x.gte(y);
}