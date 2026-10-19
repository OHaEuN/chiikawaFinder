/** 하루치 변화. 바뀐 상품의 id 만 적는다. 상품 내용은 goods.json 에서 찾아 쓴다. */
export interface HistoryDay {
  date: string;
  /** 그날의 원/엔 환율. 받아오지 못한 날은 0 */
  krwPerJpy: number;
  /** 그날 새로 올라온 상품 */
  added: string[];
  /** 그날 살 수 있다가 품절된 상품 */
  soldOut: string[];
  /** 그날 품절이었다가 다시 살 수 있게 된 상품 */
  backInStock: string[];
}

export interface History {
  /** 마지막으로 기록한 날 */
  updatedAt: string;
  /** 날짜 오름차순 */
  days: HistoryDay[];
}
