#pragma once

#define BMS_ELEMS_MAX 4096
#define BMS_BRACKETS_MAX 256
typedef struct{
  int xs; /** number of columns */
  int ys; /** number of rows */
  int m[BMS_ELEMS_MAX]; /** matrix body */
  int bs; /** number of brackets */
  int b[BMS_BRACKETS_MAX]; /** brackets */
}Bm;/* Bashicu Matrix (BM) with bracket */

#define VERSIONS (5)
typedef enum{
  eBMS_VER_4=0, /* BM4 */
  eBMS_VER_2=1, /* BM2 */
  eBMS_VER_1d1=2, /* BM1.1 */
  eBMS_VER_3d3=3, /* BM3.3 */
  eBMS_VER_DBM=4, /* DBM */
}eBMS_VER;

const char version_string[VERSIONS][16]={
  "BM4",
  "BM2",
  "BM1.1",
  "BM3.3",
  "DBM",
};

/** @fn Bm* initbm(void)
 * @brief allocate memory for new BM and returns the pointer of BM.
 * @return the pointer for the new BM */
Bm* initbm(void);

/** @fn Bm* parse(char *str)
 * @brief Allocate memory for new BM and parse string str into Bm.
 * @param str = string expression of BM. For example, str="(0,0,0)(1,1,1)[12]". 
 * @return BM represented in str */
Bm* parse(char *str);

/** @fn void printbm(Bm *bm)
 * @brief print string expression of bm to stdout. 
 * @param bm = BM to print */
void printbm(Bm *bm);
char *bm2str(Bm *bm);

/** @fn Bm* expand(Bm* bm0, eBMS_VER, int detail)
 * @brief Allocate memory for new BM, expand bm0 into new BM memory, and return its pointer.
 * @param bm0 = initial matrix.
 * @param ver = version of expansion.
 * @param detail != 0:show detail.
 * @return the pointer for the expansion result */
Bm* expand(Bm* bm0, eBMS_VER ver, int detail);

/** @fn int compmat(Bm* a, Bm *b)
 * @brief compare matrices of a and b and return which is larger. (brackets are ignored.)
 * @param a, b input bm
 * @return +1: if a>b
 *          0: if a=b
 *         -1: if a<b. */
int compmat(Bm* a, Bm* b);

/** @fn int isstd(Bm* b)
 * @brief check b is standard.
 * @param b input bm
 * @return +1: if b is standard.
 *          0: if b is not standard. */
int isstd(Bm *b, eBMS_VER ver, int detail);
int checkloop(Bm *b, eBMS_VER ver, int detail);
int checklooprec(Bm *b0, Bm *b1, int depth, int lastcommand, char *str, eBMS_VER ver, int detail);

/**
 * @brief Holds the types of the decrements used to check for loops
 */
typedef enum{
  NONE, /* No previous decrements */
  CUT, /* simple cut -- [0]^n */
  REDUCE, /* reduce in same length -- <-n> => ([1][0]^a_k)_k=0^n */
  EXPAND /* expand by [n] */
}commandType;
/**
 * @brief Holds the information about the matrices to be checked for in the process of checking for a loop
 */
typedef struct{
  Bm *bm; /* The matrix */
  int depth; /* The remaining depth for this item to be checked for */
  char *str; /* The string representing the relation of this item to the initial matrix */
  commandType lastcommand;
}loopitem;

int checkloopnew(Bm *b, eBMS_VER ver, int detail);
/** @fn loopitem *checkloopnewrec(Bm *bm0, Bm *bm1, int maxdepth, eBMS_VER ver, int detail)
 * @brief Checks if the given matrix has a loop within the given range and depth.
 * 
 * @param bm0 (starting) lower bound
 * @param bm1 upper bound, i.e. the initial matrix
 * @param maxdepth maximum number of steps to expand
 * @param ver version of BMS
 * @param detail if true, prints the details of the process
 * @param outputevery outputs once every this many lines
 * @return loopitem* the loopitem that caused the loop, or NULL if no loop was found or run out of memory
 */
loopitem *checkloopnewrec(Bm *bm0, Bm *bm1, int maxdepth, eBMS_VER ver, int detail, int outputevery);