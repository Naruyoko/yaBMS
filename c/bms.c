#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <getopt.h>
#include "bms.h"
static void printhelp(void);
static void printcopyright(void);
int main(int argc, char **argv){
  eBMS_VER ver=eBMS_VER_4;
  int flagstd=0;
  int flagloop=0;
  int flagloopnew=0;  
  int flagcmp=0;
  int flagexp=0;
  int flagrec=0;
  int detail=0;
  int flaghelp=0;
  /* check option */
  char arg;
  while((arg=getopt(argc, argv, "v:hdeslkcr")) != -1){
    switch(arg){
      case 'h': flaghelp    = 1; break;
      case 'c': flagcmp     = 1; break;
      case 'd': detail      = 1; break;
      case 'l': flagloop    = 1; break;
      case 'k': flagloopnew = 1; break;
      case 'e': flagexp     = 1; break;
      case 'r': flagrec     = 1; break;
      case 's': flagstd     = 1; break;
      case 'v':
        if(
          strcmp(optarg,"4")  ==0 ||
          strcmp(optarg,"4.0")==0 ||
          strcmp(optarg,"2.3")==0 ||
          strcmp(optarg,"BM4")  ==0 ||
          strcmp(optarg,"BM4.0")==0 ||
          strcmp(optarg,"BM2.3")==0 ||
          strcmp(optarg,"BMS4")  ==0 ||
          strcmp(optarg,"BMS4.0")==0 ||
          strcmp(optarg,"BMS2.3")==0 ||
          0){
          ver = eBMS_VER_4;
        }else if(
          strcmp(optarg,"BM2"  )==0 ||
          strcmp(optarg,"BM2.0")==0 ||
          strcmp(optarg,"BMS2"  )==0 ||
          strcmp(optarg,"BMS2.0")==0 ||
          strcmp(optarg,"2"  )==0 ||
          strcmp(optarg,"2.0")==0 ||
          0){
          ver = eBMS_VER_2;
        }else if(
          strcmp(optarg,"BM1.1")==0 ||
          strcmp(optarg,"BMS1.1")==0 ||
          strcmp(optarg,"1.1"  )==0 ||
          0){
          ver = eBMS_VER_1d1;
        }else if(
          strcmp(optarg,"BM3.3")==0 ||
          strcmp(optarg,"BMS3.3")==0 ||
          strcmp(optarg,"3.3"  )==0 ||
          0){
          ver = eBMS_VER_3d3;
        }else if(
          strcmp(optarg,"DBM")==0 ||
          strcmp(optarg,"DBMS")==0 ||
          strcmp(optarg,"DBM4")==0 ||
          strcmp(optarg,"DBMS4")==0 ||
          strcmp(optarg,"DBM4.0")==0 ||
          strcmp(optarg,"DBMS4.0")==0 ||
          0){
          ver = eBMS_VER_DBM;
        }
      break;
      default:
      break;
    }
  }
  if(argc==1 || flaghelp){
    printhelp();
    if(detail) printcopyright();
    return EXIT_SUCCESS;
  }
  if(!flagloop&&!flagloopnew&&!flagexp&&!flagstd&&!flagcmp){ /* there is no command in option */
    flagexp=1; /* recognize expansion command */
  }

  /* check std */
  if(flagstd){
    if(argc<optind+1){
      printf("error: input is not enough.\n");
      printf("usage: ./bms -s bms0\n");
      return EXIT_FAILURE;
    }
    Bm *bm0=parse(argv[optind]);
    int std=isstd(bm0,ver,detail);
    if(detail){
      printf(std?"standard.\n":"non-standard.\n");
    }else{
      printf(std?"1\n":"0\n");
    }
    if(bm0)free(bm0);
    return EXIT_SUCCESS;
  }

  /* expand */
  if(flagexp){
    if(argc<optind+1){
      printf("error: input is not enough.\n");
      printf("usage: ./bms -e bms0\n");
      return EXIT_FAILURE;
    }
    Bm *bm0=parse(argv[optind]);
    while(bm0->bs>0){
      Bm *bm1=expand(bm0,ver,detail);
      printbm(bm1);
      printf("\n");
      if(!flagrec)break;
      memcpy(&bm0->m[0], &bm1->m[0], sizeof(int)*bm1->xs*bm1->xs);
      memcpy(&bm0->b[0], &bm1->b[0], sizeof(int)*bm1->bs);
      bm0->bs=bm1->bs;
      bm0->xs=bm1->xs;
      bm0->ys=bm1->ys;
      if(bm1)free(bm1);
    }
    if(bm0)free(bm0);
    return EXIT_SUCCESS;
  }

  /* compare */
  if(flagcmp){
    if(argc!=optind+2){
      printf("error: input is not enough.\n");
      printf("usage: ./bms -c bms0 bms1\n");
      return EXIT_FAILURE;
    }
    Bm *bm0=parse(argv[optind+0]);
    Bm *bm1=parse(argv[optind+1]);
    int r=compmat(bm0,bm1);
    if(detail){
      printbm(bm0);
      if(r<0){
        printf(" < ");
      }else if(r==0){
        printf(" == ");
      }else{
        printf(" > ");
      }
      printbm(bm1);
      printf("\n");
    }else{
      printf("%d\n",r);
    }
    if(bm0)free(bm0);
    if(bm1)free(bm1);
    return EXIT_SUCCESS;
  }
  /* check loop */
  if(flagloop){
    if(flagrec){
      if(argc!=optind+2&&argc!=optind+3){
        printf("error: input is not enough.\n");
        printf("usage: ./bms -lr bms0 bms1\n");
        printf("       ./bms -lr bms0 bms1 [depth]\n");
        return EXIT_FAILURE;
      }
      Bm *bm0=parse(argv[optind+0]);
      Bm *bm1=parse(argv[optind+1]);
      int depth=3;
      if(argc==optind+3){
        depth=atoi(argv[optind+2]);
      }
      if(detail)printf("version : %s\n",version_string[ver]);
      char *str=bm2str(bm1);
      int ret=checklooprec(bm0, bm1, depth, 0, str, ver, detail);
      if(str)free(str);
      if(detail){
        printf("%s",ret?"loop!\n":"No loops were found.\n");
      }else{
        printf("%s",ret?"1":"0");
      }
      if(bm0)free(bm0);
      if(bm1)free(bm1);
      return EXIT_SUCCESS;
    }else{
      if(argc!=optind+1){
        printf("error: input is not enough.\n");
        printf("usage: ./bms -l bms0\n");
        return EXIT_FAILURE;
      }
      Bm *bm0=parse(argv[optind+0]);
      if(detail)printf("version : %s\n",version_string[ver]);
      while(bm0->bs>0){
        if(detail){
          printf("original: ");printbm(bm0);printf("\n");
        }
        Bm *bm1=expand(bm0,ver,0);
        memcpy(&bm0->m[0], &bm1->m[0], sizeof(int)*bm1->xs*bm1->xs);
        memcpy(&bm0->b[0], &bm1->b[0], sizeof(int)*bm1->bs);
        bm0->bs=bm1->bs;
        bm0->xs=bm1->xs;
        bm0->ys=bm1->ys;
        if(bm1)free(bm1);
      }
      int isloop=checkloop(bm0,ver,detail);
      if(!detail){
        printf(isloop?"1\n":"0\n");
      }
      if(bm0)free(bm0);
      return EXIT_SUCCESS;
    }
  }
  /* check loop experimental algorithm */
  if(flagloopnew){
    if(flagrec){
      if(argc!=optind+2&&argc!=optind+3&&argc!=optind+4){
        printf("error: input is not enough.\n");
        printf("usage: ./bms -kr bms0 bms1\n");
        printf("       ./bms -kr bms0 bms1 [depth]\n");
        printf("       ./bms -kdr bms0 bms1 [depth] [outputevery]\n");
        return EXIT_FAILURE;
      }
      Bm *bm0=parse(argv[optind+0]);
      Bm *bm1=parse(argv[optind+1]);
      int depth=3;
      if(argc>=optind+3){
        depth=atoi(argv[optind+2]);
      }
      int outputevery=1;
      if(argc>=optind+4){
        outputevery=atoi(argv[optind+3]);
      }
      if(detail)printf("version : %s\n",version_string[ver]);
      char *str=bm2str(bm1);
      loopitem* ret=checkloopnewrec(bm0, bm1, depth, ver, detail, outputevery);
      if(str)free(str);
      if(detail){
        printf("%s",ret?"loop!\n":"No loops were found.\n");
      }else{
        printf("%s",ret?"1":"0");
      }
      if(ret){
        printf("At %s = ",ret->str);
        ret->bm->bs=0;
        printbm(ret->bm);
        printf("\n");
      }
      fflush(stdout);
      if(bm0)free(bm0);
      if(bm1)free(bm1);
      if(ret){
        if(ret->bm)free(ret->bm);
        if(ret->str)free(ret->str);
      }
      return EXIT_SUCCESS;
    }else{
      printf("error: -k requires -r to be present.\n");
      printf("usage: ./bms -kr bms0\n");
      return EXIT_FAILURE;
    }
  }
  printf("error: no command.\n");
  printf("       see help by ./bms -h\n");
  return EXIT_FAILURE;
}
char *bm2str(Bm *bm){
  char *str=malloc(1024);
  str[0]='\0';
  if(bm){
    int xs=bm->xs;
    int ys=bm->ys;
    if(xs!=0){
      for(int x=0;x<xs;x++){
        sprintf(str,"%s(",str);
        sprintf(str,"%s%d",str,bm->m[x*ys]);
        for(int y=1;y<ys;y++){
          sprintf(str,"%s,%d",str,bm->m[x*ys+y]);
        }
        sprintf(str,"%s)",str);
      }
    }
    for(int b=0;b<bm->bs;b++){
      sprintf(str,"%s[%d]",str,bm->b[b]);
    }
  }
  return str;
}
void printbm(Bm *bm){
  if(bm){
    int xs=bm->xs;
    int ys=bm->ys;
    if(xs!=0){
      for(int x=0;x<xs;x++){
        printf("(");
        printf("%d",bm->m[x*ys]);
        for(int y=1;y<ys;y++){
          printf(",%d",bm->m[x*ys+y]);
        }
        printf(")");
      }
    }
    for(int b=0;b<bm->bs;b++){
      printf("[%d]",bm->b[b]);
    }
  }
}
Bm* initbm(void){
  Bm *bm=malloc(sizeof(Bm));
  return bm;
}
Bm* clone(Bm *bm0){
  Bm *bm1=initbm();
  bm1->xs=bm0->xs;
  bm1->ys=bm0->ys;
  bm1->bs=bm0->bs;
  memcpy(bm1->m, bm0->m, sizeof(int)*bm0->xs*bm0->ys);
  memcpy(bm1->b, bm0->b, sizeof(int)*bm0->bs);
  return bm1;
}
Bm *parse(char *str){
  Bm *bm=initbm();
  bm->xs=0;
  bm->ys=-1;
  int ys = 0;
  int *wp = &bm->m[0];
  char *c;
  //parse matrix
  for(c=&str[0];*c!='['&&*c!='\0';c++){
    switch(*c){
      case '(':
        ys=0;
        *wp=0;
      break;
      case '0': case '1': case '2': case '3': case '4': case '5':
      case '6': case '7': case '8': case '9': 
        (*wp)*=10;
        (*wp)+=*c-'0';
      break;
      case ',':
        ys++;
        wp++;
        *wp=0;
      break;
      case ')':
        ys++;
        wp++;
        *wp=0;
        bm->xs++;
        if(bm->ys!=-1 && bm->ys!=ys){
          fprintf(stderr,"error:ys mismatch in %s\n",str);
          return NULL;
        }
        bm->ys=ys;
      break;
      default:
      break;
    }//switch
  }//for

  //parse brackets
  wp=bm->b;
  bm->bs=0;
  for(int exit=0;!exit;c++){
    switch(*c){
      case '0': case '1': case '2': case '3': case '4': case '5':
      case '6': case '7': case '8': case '9': 
        *wp*=10;
        *wp=*c-'0';
      break;
      case ']':
        wp++;
        *wp=0;
        bm->bs++;
      break;
      case '\0':
        exit=1; /* exit */
      break;
      default:
        /* ignore */
      break;
    }
  }
  return bm;
}

Bm* expand(Bm* bm0, eBMS_VER ver, int detail){
  Bm *bm1=initbm(); /* expand result */

  /* in the case of no brackets */
  if(bm0->bs==0){ 
    /* return identical */
    Bm *bm1=initbm();
    memcpy(bm1,bm0,sizeof(Bm));
    memcpy(bm1->m,bm0->m,sizeof(int)*bm0->xs+bm0->ys);
    memcpy(bm1->b,bm0->b,sizeof(int)*bm0->bs);
    return bm1;
  }


  /* brackets */
  int bs=bm0->bs;
  int b =bm0->b[0]; /* top bracket */
  bm1->bs=bs-1;
  memcpy(bm1->b, &(bm0->b[1]), sizeof(int)*(bs-1));
  
  
  /* zero */
  if(bm0->xs==0){ 
    bm1->xs=0;
    bm1->ys=0;
    return bm1;
  }

  int xs=bm0->xs;
  int ys=bm0->ys;
  int *m=bm0->m;
  int xsm1ys = (xs-1)*ys;
  int *p=&m[xsm1ys];
  int x,y;

  /* find lowermost non zero */
  for(y=0;y<ys;y++){
    if(*p++==0) break;
  }
  int lnz=y-1;

  /* simple cut case */
  if(y==0||b==0){ /* child=(0,...,0) or X[0] */
    memcpy(bm1->m, bm0->m, sizeof(int)*xsm1ys);
    bm1->xs=xs-1;
    bm1->ys=ys;
    return bm1;
  }
  /* make parent index matrix */
  int *pim=malloc(sizeof(int)*xs*ys); /* parent index matrix  */
  int *rp=&m[0];
  int *wp=&pim[0];
  for(x=0;x<xs;x++){

    /* the 1st row */
    int c=*rp++;
    int px;
    for(px=x-1;px>=0;px--){
      if(m[px*ys]<c) break;
    }
    *wp++=px;
      
    /* the 2nd or lower rows */
    for(y=1;y<ys;y++){
      c=*rp++;
      if(c==0){
        *wp++=-1;
        continue;
      }
      for(px=*(wp-1);px!=-1;px=pim[px*ys+y-1]){
        if(m[px*ys+y]<c) break;
      }
      *wp++=px;
    }/* for y */
  }/* for x */

  /* find bad root */
  int r=pim[(x-1)*ys+lnz]; /* bad root index */
  int bpxs = xs-r-1; /* number of columns of bad part */

  /* make delta */
  int *delta=malloc(sizeof(int)*lnz); /* delta[y] = ascension height of row y */
  for(y=0;y<lnz;y++){
    delta[y]=m[xsm1ys+y]-m[r*ys+y];
  }

  /* make ascension matrix */ 
  int nzs=lnz+1;
  int *am=malloc(sizeof(int)*bpxs*nzs); /* am[x*lnz+y]=0:not ascend/1:ascend */
  memset(am,0,sizeof(int)*bpxs*nzs);
  wp=am;
  switch(ver){
    case eBMS_VER_1d1:
      for(int n=0;n<bpxs*nzs;n++)*wp++=1;
    break;
    case eBMS_VER_4:
    case eBMS_VER_DBM:
      for(y=0;y<nzs;y++) *wp++=1; /* all bad root elements are ascent */
      for(x=1;x<bpxs;x++){
        for(y=0;y<nzs;y++){
          int p=pim[(r+x)*ys+y];
          if(p<r){
            *wp++=0;
          }else{
            *wp++ = am[(p-r)*nzs+y];
          }
        }
      }
    break;
    case eBMS_VER_2:
      for(y=0;y<nzs;y++) *wp++=1; /* all bad root elements are ascent */
      for(x=1;x<bpxs;x++){
        for(y=0;y<nzs;y++){
          int pi = pim[(r+x)*ys+0]; /* BM2 always see first row(0) */
          *wp++ = pi>=0 && am[(pi-r)*nzs+y] && m[(r+x)*ys+y]>m[r*ys+y];
        }
      }
    break;
    case eBMS_VER_3d3:
      am[lnz]=1; /* BR in LNZ */
      /* propagate 1 to decendants of LNZ in BR */
      for(x=0;x<bpxs;x++){
        int p=pim[(x+r)*ys+lnz];
        if(p>=r && am[(p-r)*nzs+lnz]) am[x*nzs+lnz]=1;
      }
      /* propagate 1 to upper rows */
      for(x=0;x<bpxs;x++){
        for(y=0;y<nzs-1;y++){
          am[x*nzs+y]=am[x*nzs+lnz];
        }
      }
      for(x=1;x<bpxs;x++){
        for(y=0;y<nzs;y++){
          if(am[x*nzs+y]==0){
            int p=pim[(x+r)*ys+y];
            if(p>r &&  /* The parent is righter than BR */
               am[(p-r)*nzs+y]==1){ /* The parent is ascent */
              am[x*nzs+y]=1;
            }
          }
        }
      }
    break;
    default:
    break;
  }

  /* copy good part+first bad part */
  memcpy(bm1->m,m,sizeof(int)*xsm1ys);
  
  /* copy new bad part */
  rp  =&bm1->m[ r    *ys];
  wp  =&bm1->m[xsm1ys];
  for(int a=0;a<b;a++){ /* copy b times */
    int *rpam=&am[0];
    for(x=0;x<bpxs;x++){
      int *pd=&delta[0];
      for(y=0;y<lnz;y++){
        *wp++=*rp++ + (*rpam++)*(*pd++);
      }
      rpam++; /* skip lnz */
      for(y=lnz;y<ys;y++){
        *wp++=*rp++;
      }
    }
  }
  bm1->ys=ys;
  bm1->xs=xs-1+b*bpxs;
  if(detail){
    printf("\nversion             = %s\n",version_string[ver]);
    printf("Input               =");
    printbm(bm0);
    printf("\nParent Index Matrix =");
    for(x=0;x<xs;x++){
      printf("(%d",pim[x*ys]);
      for(y=1;y<ys;y++) printf(",%d",pim[x*ys+y]);
      printf(")");
    }
    printf("\ngood part           =");
    for(x=0;x<r;x++){
      printf("(");
      for(y=0;y<ys;y++){
        printf("%d",bm0->m[x*ys+y]);
        if(y<ys-1)printf(",");
      }
      printf(")");
    }
    printf("\nbad part            =");
    for(x=r;x<xs-1;x++){
      printf("(");
      for(y=0;y<ys;y++){
        printf("%d",bm0->m[x*ys+y]);
        if(y<ys-1)printf(",");
      }
      printf(")");
    }
    printf("\nbad root            = %d\n",r);
    printf("lnz                 = %d\n",lnz);
    printf("delta               =(%d",delta[0]);
    for(y=1;y<lnz;y++)printf(",%d",delta[y]);
    printf(")\nAsension Matrix     =");
    for(x=0;x<bpxs;x++){
      printf("(%d",am[x*nzs]);
      for(y=1;y<nzs;y++) printf(",%d",am[x*nzs+y]);
      printf(")");
    }
    printf("\n\n");
  }
  if(am) free(am);
  if(pim) free(pim);
  if(delta) free(delta);
  return bm1;
}
int compmat(Bm *a, Bm *b){
  int *pa=&a->m[0];
  int *pb=&b->m[0];
  if(a->ys < b->ys){
    for(int x=0;x<b->xs;x++){
      for(int y=a->ys+1;y<b->ys;y++){
        if(b->m[x*b->ys+y]!=0){
          return +1;
        }
      }
    }
    Bm *b1=initbm();
    b1->xs=b->xs;
    b1->ys=a->xs;
    for(int x=0;x<a->xs;x++){
      memcpy(&b1->m[x*b1->ys],&b->m[x*b->ys],sizeof(int)*(a->ys));
    }
    b1->bs=0;
    int ret = compmat(a, b1);
    if(b1)free(b1);
    return ret;
  }else if(a->ys < b->ys){
    for(int x=0;x<a->xs;x++){
      for(int y=b->ys+1;y<a->ys;y++){
        if(a->m[x*a->ys+y]!=0){
          return +1;
        }
      }
    }
    Bm *a1=initbm();
    a1->xs=a->xs;
    a1->ys=b->xs;
    for(int x=0;x<b->xs;x++){
      memcpy(&a1->m[x*a1->ys],&a->m[x*a->ys],sizeof(int)*(b->ys));
    }
    a1->bs=0;
    int ret = compmat(a1, b);
    if(a1)free(a1);
    return ret;
  }else{
    /* lexicographical compare */
    int n=(a->xs<b->xs?a->xs:b->xs)*a->ys;
    for(int i=0;i<n;i++){
      if(*pa>*pb)return +1;
      if(*pa<*pb)return -1;
      pa++;
      pb++;
    }
    if     (a->xs > b->xs) return +1;
    else if(a->xs < b->xs) return -1;
    else                   return  0;
  }
}
int isstd(Bm *b, eBMS_VER ver, int detail){
  /* find the first non-lexicographical element from stringly left */
  Bm *s=initbm();
  s->xs=b->xs;
  s->ys=b->ys;
  s->bs=0;
  int *rp=b->m;
  int *wp=s->m;
  for(int x=0;x<s->xs;x++){
    for(int y=0;y<s->ys;y++){
      if(ver==eBMS_VER_DBM){
        /* dimensional BMS ---------------*/
        if(*rp>x-y && x>=y){ /* illegal */
          return 0;
        }else if(*rp<x-y){ /* found */
          *wp++=*rp+1;
          memset(wp,0,sizeof(int)*(s->ys-y-1));
          s->xs=x+1;
          break;
        }
        *wp=x>y?x-y:0;
        rp++;
        wp++;
      }else{ /* normal BMS ---------------*/
        if(*rp>x){ /* illegal */
          return 0;
        }else if(*rp<x){ /* found */
          *wp++=*rp+1;
          memset(wp,0,sizeof(int)*(s->ys-y-1));
          s->xs=x+1;
          break;
        }
        *wp=x;
        rp++;
        wp++;
      }
    }
  }

  int ret=-1;
  while(ret==-1){
    int oldxsm1=s->xs-1;
    int bplen;
    if(detail){printbm(s);printf("\n");}
    switch(compmat(s,b)){
      case 0:
        ret = 1;
      break;
      case +1:
        /* try expand(s[1]) */
        s->bs=1;
        s->b[0]=1; 
        Bm *s2=expand(s,ver,0);
        bplen = s2->xs-oldxsm1;
        if(bplen!=0){
          s->b[0] = (b->xs-oldxsm1)/bplen+1;
        }else{
          s->b[0]=0;
        }
        if(s2)free(s2);
        /* expand(s[n]) > b */
        s2=expand(s,ver,0);
        if(s)free(s);
        s=s2;
        /* cut in the size of b */
        s->xs=(s->xs>b->xs)?b->xs:s->xs;
        /* reduce  */
        for(int x=0;x<s->xs;x++){
          for(int y=0;y<s->ys;y++){
            if(s->m[x*s->ys+y] > b->m[x*s->ys+y]){
              s->xs=x+1;
            }
          }
        }
        if(detail){printbm(s);printf("\n");}

      break;
      case -1:
        ret = 0;
      default:
      break;
    }
  }
  if(s)free(s);
  return ret;
}
int checkloop(Bm *b, eBMS_VER ver, int detail){
  int ret=-1;
  int ys=b->ys;
  b->bs=1;
  b->b[0]=1;
  Bm *eb=expand(b,ver,0);
  int bplen=eb->xs-(b->xs-1);

  Bm *bpeb=initbm();
  bpeb->xs=bplen+1;
  bpeb->ys=ys;
  bpeb->bs=0;
  memcpy(bpeb->m, &b->m[(b->xs-(bplen+1))*ys], sizeof(int)*bpeb->xs*ys);
  Bm *obpeb=clone(bpeb);
  for(int y=0;y<ys;y++){
    int offset=bpeb->m[y];
    for(int x=0;x<bpeb->xs;x++){
      obpeb->m[x*ys+y]-=offset;
      if(obpeb->m[x*ys+y]<0)obpeb->m[x*ys+y]=0;
    }
  }
  if(compmat(obpeb,b)>0){
    ret = 1;
  }else{
    ret = 0;
  }
  if(detail){
    printf("version : %s\n",version_string[ver]);
    printf("original: ");printbm(b);printf("\n");
    printf("bad part: ");printbm(bpeb);printf("\n");
    printf("offset  : ");printbm(obpeb);printf("\n");
    if(compmat(obpeb,b)>0){
      printbm(obpeb);
      printf(" > ");
      printbm(b);
      printf(" : Loop!\n");
    }else{
      if(detail){
        printbm(bpeb);
        printf(" < ");
        printbm(b);
        printf(" : The loop was not found.\n");
      }
    }
  }

  if(eb)free(eb);
  if(bpeb)free(bpeb);
  if(obpeb)free(obpeb);
  return ret;
}
static void printhelp(void){
  printf("usage  : ./bms [-e] [-d] [-r] [-v ver] <bm> # expands bm.\n"
         "       : ./bms  -s  [-d]      [-v ver] <bm> # check bm is standard or not.\n"
         "       : ./bms  -l  [-d]      [-v ver] <bm> # check bm has loop in a next expand.\n"
         "       : ./bms  -l  [-d] [-r] [-v ver] <bm0> <bm1> [<depth>] \n"
         "       : ./bms  -c                     <bm0> <bm1> # compare the size of them.\n"
         "         # search loop from bm1 until bm0 in <depth> times-expansion.\n"
         "       : ./bms  -h                          # shows help.\n"
         "       : ./bms  -hd                         # shows copyrights.\n"
         "\n"
         "example: ./bms \"(0,0,0)(1,1,1)(2,0,0)(1,1,1)[2]\"\n"
         "         (0,0,0)(1,1,1)(2,0,0)(1,1,0)(2,2,1)(3,0,0)(2,2,0)(3,3,1)(4,0,0)\n"
         "\n"
         "example: ./bms -r \"(0,0,0)(1,1,1)(2,0,0)(1,1,1)[2][1]\"\n"
         "         (0,0,0)(1,1,1)(2,0,0)(1,1,0)(2,2,1)(3,0,0)(2,2,0)(3,3,1)(4,0,0)[1]\n"
         "         (0,0,0)(1,1,1)(2,0,0)(1,1,0)(2,2,1)(3,0,0)(2,2,0)(3,3,1)(3,3,1)\n"
         "\n"
         "example: ./bms -lrdv 1.1 \"(0,0,0)(1,1,1)(2,0,0)(1,1,0)(2,2,1)(3,0,0)(2,2,0)(3,1,1)(4,0,0)\" \"(0,0,0)(1,1,1)(2,0,0)(1,1,0)(2,2,1)(3,0,0)(2,2,0)(3,3,1)(4,0,0)(5,1,1)\" 3\n"
         "\n"
         "param  : bm  = bashicu matrix with bracket to expand\n"
         "\n"
         "options:\n"
         " -v ver : expand with version ver.\n"
         "          ver = {4, 3.3, 2, 1.1, DBMS} (default = 4)\n"
         " -r     : continue to expand multi-brackets\n"
         " -d     : show detail output\n"
         "\n"
         "notes  : activate function is f(x)=x.\n");
}
int checklooprec_sub(Bm *bm0, Bm *bm2, char* str2, int depth, int lastcommand, eBMS_VER, int detail);
int checklooprec(Bm *bm0, Bm *bm1, int depth, int lastcommand, char *str, eBMS_VER ver, int detail){
  if(depth == 0) return 0;
  int ret=0;

  /* simple cut [0]^1--9 */
  if(lastcommand!=1){
    Bm *bm2=clone(bm1);
    for(int i=1;i<=9;i++){
      bm2->xs=bm1->xs-i;
      char *str2=malloc(strlen(str)+6);
      sprintf(str2, "%s[0]^%d",str,i);
      ret=checklooprec_sub(bm0, bm2, str2, depth, 1, ver, detail);
      if(str2)free(str2);
      if(ret){
        if(bm2)free(bm2);
        return ret;
      }
    }
    if(bm2)free(bm2);
  }

  /* reduce in same length */
  if(lastcommand!=2){
    Bm *bm2=clone(bm1);
    int xs=bm2->xs;
    int ys=bm2->ys;
    int amount=0;
    int isfound=0;
    do{
      int *p=&bm2->m[xs*ys-1];
      isfound=0;
      for(int i=0;i<ys;i++){
        if(*p!=0){
          (*p)--;
          isfound=1;
          break;
        }else{
          p--;
        }
      }
      if(isfound){
        amount++;
        char *str2=malloc(strlen(str)+10);
        sprintf(str2, "%s<-%d>",str,amount);
        ret=checklooprec_sub(bm0, bm2, str2, depth, 2, ver, detail);
        if(str2)free(str2);
        if(ret){
          if(bm2)free(bm2);
          return ret;
        }
      }
    }while(isfound);
    if(bm2)free(bm2);
  }

  /* expand by [n] */
  for(int k=1;k<=2;k++){
    Bm *bm11=clone(bm1);
    bm11->bs=1;
    bm11->b[0]=k;
    Bm *bm2=expand(bm11,ver,0);
    char *str2=malloc(strlen(str)+4);
    sprintf(str2, "%s[%d]",str,k);
    ret=checklooprec_sub(bm0, bm2, str2, depth, 3, ver, detail);
    if(str2)free(str2);
    if(bm2)free(bm2);
    if(bm11)free(bm11);
    if(ret)return ret;
  }
  return 0;
}

int checklooprec_sub(Bm *bm0, Bm *bm2, char* str2, int depth, int lastcommand, eBMS_VER ver, int detail){
  if(detail){
    printf("%s = ", str2);
    bm2->bs=0;
    printbm(bm2);
  }
  if(compmat(bm2,bm0)<=0){
    if(detail)printf(" <\n");
    return 0;
  }
  int ret=checkloop(bm2,ver,0);
  if(detail)printf(" %d\n",ret);
  if(ret){
    checkloop(bm2,ver,1);
    return ret;
  }
  ret=checklooprec(bm0, bm2, depth-1, lastcommand, str2, ver, detail);
  return ret;
}

loopitem *checkloopnewrec(Bm *bm0, Bm *bm1, int maxdepth, eBMS_VER ver, int detail, int outputevery){
  unsigned int L_size=1024;
  loopitem *L=malloc(sizeof(loopitem)*L_size);
  if(L==NULL){
    printf("Error: Out of memory\n");
    return NULL;
  }
  Bm **y_min_upper=malloc(sizeof(Bm*)*(maxdepth+1));
  if(y_min_upper==NULL){
    printf("Error: Out of memory\n");
    if(L)free(L);
    return NULL;
  }
  for(int i=0;i<=maxdepth;i++){
    y_min_upper[i]=NULL;
  }
  loopitem *L_cur=L;
  loopitem *L_end=L+(L_size-1);
  L_cur->bm=clone(bm1);
  L_cur->depth=maxdepth;
  L_cur->str=bm2str(bm1);
  L_cur->lastcommand=NONE;
  Bm *x_max=clone(bm1);
  Bm *y_min=clone(bm0);
  long long unsigned int detaillinecount=0;
  #define EXPAND_LIMIT (2)
  #define CUT_LIMIT (9)
  #define PRINT_DETAIL_STEPS(item){       \
    if(detail){                           \
      detaillinecount++;                  \
      if(detaillinecount%outputevery==0){ \
        printf("%s = ", item->str);       \
        item->bm->bs=0;                   \
        printbm(item->bm);                \
        printf("\n");                     \
      }                                   \
    }                                     \
  }
  #define UPDATE_LOWER_BOUND(value){      \
    if(y_min)free(y_min);                 \
    y_min=value;                          \
    if(detail){                           \
      detaillinecount++;                  \
      if(detaillinecount%outputevery==0){ \
        printf("New lower bound = ");     \
        y_min->bs=0;                      \
        printbm(y_min);                   \
        printf("\n");                     \
      }                                   \
    }                                     \
  }
  #define FREE_POPPED_CONTENT_EXCEPT_MATRIX(){ \
    if(str)free(str);                          \
  }
  #define FREE_POPPED_CONTENT(){ \
    if(str)free(str);            \
    if(bm)free(bm);              \
  }
  #define FREE_EXCEPT_L(){                    \
    if(x_max)free(x_max);                     \
    if(y_min)free(y_min);                     \
    for(int i=0;i<=maxdepth;i++){             \
      if(y_min_upper[i])free(y_min_upper[i]); \
    }                                         \
    if(y_min_upper)free(y_min_upper);         \
  }
  #define FREE_AND_RETURN(return_value){                        \
    for(loopitem *L_i=L;L_i<L_cur+(return_value!=L_cur);L_i++){ \
      if(L_i->bm)free(L_i->bm);                                 \
      if(L_i->str)free(L_i->str);                               \
    }                                                           \
    if(L)free(L);                                               \
    FREE_EXCEPT_L();                                            \
    return return_value;                                        \
  }
  while(L_cur>=L){
    int fnext=0;
    loopitem *x=L_cur;
    Bm *bm=x->bm;
    int depth=x->depth;
    char *str=x->str;
    commandType lastcommand=x->lastcommand;
    if(checkloop(bm,ver,0)){
      checkloop(bm,ver,1);
      FREE_AND_RETURN(L_cur);
    }
    L_cur--;
    if(depth){
      int xs=bm->xs;
      int ys=bm->ys;
      if (y_min_upper[depth]!=NULL){
        UPDATE_LOWER_BOUND(y_min_upper[depth]);
        for(int i=0;i<depth;i++){
          if(y_min_upper[i])free(y_min_upper[i]);
          y_min_upper[i]=NULL;
        }
      }
      y_min_upper[depth]=bm;
      Bm *bm11=clone(bm);
      bm11->bs=1;
      bm11->b[0]=EXPAND_LIMIT;
      Bm *bm2=expand(bm11,ver,0);
      if(compmat(bm2,y_min)<=0){
        if(bm2)free(bm2);
        if(bm11)free(bm11);
        FREE_POPPED_CONTENT_EXCEPT_MATRIX();
        continue;
      }
      if(movePointer(&L,&L_cur,&L_end,&L_size)==NULL){
        if(bm2)free(bm2);
        if(bm11)free(bm11);
        FREE_EXCEPT_L();
        return NULL;
      }
      L_cur->bm=bm2;
      L_cur->depth=depth-1;
      L_cur->str=malloc(strlen(str)+4);
      sprintf(L_cur->str, "%s[%d]",str,EXPAND_LIMIT);
      L_cur->lastcommand=EXPAND;
      PRINT_DETAIL_STEPS(L_cur);
      if(bm11)free(bm11);
      // if(checkloop(bm2,ver,0)){
      //   FREE_AND_RETURN(L_cur);
      // }
      int bplen=(bm2->xs-xs+1)/EXPAND_LIMIT;
      if(bplen){
        for(int k=EXPAND_LIMIT-1;k;k--){
          bm2=clone(bm2);
          bm2->xs=bm2->xs-bplen;
          if(compmat(bm2,y_min)<=0){
            if(bm2)free(bm2);
            fnext=1;
            FREE_POPPED_CONTENT_EXCEPT_MATRIX();
            break;
          }
          if(movePointer(&L,&L_cur,&L_end,&L_size)==NULL){
            if(bm2)free(bm2);
            FREE_EXCEPT_L();
            return NULL;
          }
          L_cur->bm=bm2;
          L_cur->depth=depth-1;
          L_cur->str=malloc(strlen(str)+4);
          sprintf(L_cur->str, "%s[%d]",str,k);
          L_cur->lastcommand=EXPAND;
          PRINT_DETAIL_STEPS(L_cur);
          // if(checkloop(bm2,ver,0)){
          //   FREE_AND_RETURN(L_cur);
          // }
        }
        if(fnext)continue;
        if(lastcommand!=REDUCE&&bm2->xs>=xs){
          if(bm2->xs>xs){
            bm2=clone(bm2);
            bm2->xs=xs;
            if(compmat(bm2,y_min)<=0){
              if(bm2)free(bm2);
              FREE_POPPED_CONTENT_EXCEPT_MATRIX();
              continue;
            }
            if(movePointer(&L,&L_cur,&L_end,&L_size)==NULL){
              if(bm2)free(bm2);
              FREE_EXCEPT_L();
              return NULL;
            }
            L_cur->bm=bm2;
            L_cur->depth=depth-1;
            L_cur->str=malloc(strlen(str)+10);
            sprintf(L_cur->str, "%s<-1>",str);
            L_cur->lastcommand=REDUCE;
            PRINT_DETAIL_STEPS(L_cur);
            // if(checkloop(bm2,ver,0)){
            //   FREE_AND_RETURN(L_cur);
            // }
          }
          int amount=1;
          int isfound=0;
          int *cc=malloc(sizeof(int)*ys);
          do{
            memcpy(cc,&bm2->m[(xs-1)*ys],sizeof(int)*ys);
            isfound=0;
            int lnz=ys-1;
            while(lnz>=0){
              if(cc[lnz]!=0){
                isfound=1;
                break;
              }
              lnz--;
            }
            int br=xs-1;
            if(isfound){
              while(--br>=0){
                int yy=0;
                while(yy<=lnz&&bm2->m[br*ys+yy]<cc[yy]){
                  cc[yy]=bm2->m[br*ys+yy];
                  yy++;
                }
                if(yy>lnz)break;
              }
              if(br<0)isfound=0;
            }
            if(isfound){
              bm2=clone(bm2);
              memcpy(&bm2->m[(xs-1)*ys+lnz],&bm2->m[br*ys+lnz],ys-lnz);
              if(compmat(bm2,y_min)<=0){
                if(bm2)free(bm2);
                if(cc)free(cc);
                fnext=1;
                FREE_POPPED_CONTENT_EXCEPT_MATRIX();
                break;
              }
              if(movePointer(&L,&L_cur,&L_end,&L_size)==NULL){
                if(bm2)free(bm2);
                if(cc)free(cc);
                FREE_EXCEPT_L();
                return NULL;
              }
              L_cur->bm=bm2;
              L_cur->depth=depth-1;
              amount++;
              L_cur->str=malloc(strlen(str)+10);
              sprintf(L_cur->str, "%s<-%d>",str,amount);
              L_cur->lastcommand=REDUCE;
              PRINT_DETAIL_STEPS(L_cur);
              // if(checkloop(bm2,ver,0)){
              //   if(cc)free(cc);
              //   FREE_AND_RETURN(L_cur);
              // }
            }
          }while(isfound);
          if(fnext)continue;
          if(cc)free(cc);
        }
      }
      if(lastcommand!=CUT){
        if(bm2->xs>=xs){
          bm2=clone(bm);
          bm2->xs=xs-1;
          if(compmat(bm2,y_min)<=0){
            if(bm2)free(bm2);
            FREE_POPPED_CONTENT_EXCEPT_MATRIX();
            continue;
          }
          if(movePointer(&L,&L_cur,&L_end,&L_size)==NULL){
            if(bm2)free(bm2);
            FREE_EXCEPT_L();
            return NULL;
          }
          L_cur->bm=bm2;
          L_cur->depth=depth-1;
          L_cur->str=malloc(strlen(str)+6);
          sprintf(L_cur->str, "%s[0]^1",str);
          L_cur->lastcommand=CUT;
          PRINT_DETAIL_STEPS(L_cur);
          // if(checkloop(bm2,ver,0)){
          //   FREE_AND_RETURN(L_cur);
          // }
        }
        for(int i=2;i<=CUT_LIMIT;i++){
          bm2=clone(bm2);
          bm2->xs=bm2->xs-1;
          if(compmat(bm2,y_min)<=0){
            if(bm2)free(bm2);
            fnext=1;
            FREE_POPPED_CONTENT_EXCEPT_MATRIX();
            break;
          }
          if(movePointer(&L,&L_cur,&L_end,&L_size)==NULL){
            if(bm2)free(bm2);
            FREE_EXCEPT_L();
            return NULL;
          }
          L_cur->bm=bm2;
          L_cur->depth=depth-1;
          L_cur->str=malloc(strlen(str)+6);
          sprintf(L_cur->str, "%s[0]^%d",str,i);
          L_cur->lastcommand=CUT;
          PRINT_DETAIL_STEPS(L_cur);
          // if(checkloop(bm2,ver,0)){
          //   FREE_AND_RETURN(L_cur);
          // }
        }
        if(fnext)continue;
      }
      FREE_POPPED_CONTENT_EXCEPT_MATRIX();
    }else{
      UPDATE_LOWER_BOUND(bm);
      FREE_POPPED_CONTENT_EXCEPT_MATRIX();
    }
  }
  FREE_AND_RETURN(NULL);
  #undef PRINT_DETAIL_STEPS
  #undef UPDATE_LOWER_BOUND
  #undef FREE_POPPED_CONTENT_EXCEPT_MATRIX
  #undef FREE_POPPED_CONTENT
  #undef FREE_EXCEPT_L
  #undef FREE_AND_RETURN
}
loopitem *movePointer(loopitem **pL,loopitem **pL_cur,loopitem **pL_end,unsigned int *pL_size){
  if(*pL_cur>=*pL_end){
    *pL_size=*pL_size*2;
    *pL=realloc(*pL,sizeof(loopitem)*(*pL_size));
    printf("Expanding memory for the stack to %d\n",*pL_size);
    if(*pL==NULL){
      printf("Error: Out of memory\n");
      return NULL;
    }
    *pL_cur=*pL+(*pL_size/2);
    *pL_end=*pL+(*pL_size-1);
  }else{
    *pL_cur=(*pL_cur)+1;
  }
  return *pL;
}

void printcopyright(void){
  printf( "MIT License\n"
    "\n"
    "Copyright (c) 2020 koteitan\n"
    "\n"
    "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n"
    "\n"
    "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n"
    "\n"
    "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n"
    "\n"
    "Bashicu Matrix System is named by Bashicu in 2014.\n"
    "  https://googology.wikia.org/ja/wiki/%%E3%%83%%A6%%E3%%83%%BC%%E3%%82%%B6%%E3%%83%%BC%%E3%%83%%96%%E3%%83%%AD%%E3%%82%%B0:BashicuHyudora/BASIC%%E8%%A8%%80%%E8%%AA%%9E%%E3%%81%%AB%%E3%%82%%88%%E3%%82%%8B%%E5%%B7%%A8%%E5%%A4%%A7%%E6%%95%%B0%%E3%%81%%AE%%E3%%81%%BE%%E3%%81%%A8%%E3%%82%%81\n"
    "Dimensional BMS is named by Ecl1psed#7156. in 2019.\n"
    "  https://discord.com/channels/206932820206157824/437684636320137226/622205806766587904\n"
    "\n"
    "The rule BM1.1 is made by Bashicu in 2016.\n"
    "The rule BM2   is made by Bashicu in 2016.\n"
    "The rule BM2.3 is made by koteitan, Nish and Ecl1psed in 2018.\n"
    "The rule BM4   is made by Bashicu in 2018.\n"
    "The rule BM3.3 is made by Ecl1psed and rpakr 2019.\n"
    "The rule of Dimensinal BMS is made by Ecl1psed 2019.\n"
    "See the details of the rules here:\n"
    "  https://googology.wikia.org/wiki/User_blog:Koteitan/Categorizing_of_the_rule_sets_for_all_sub_versions_of_bashicu_matrix\n");
}
