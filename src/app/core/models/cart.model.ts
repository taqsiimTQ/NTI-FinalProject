export interface CartItem {
  bookId: number;
  quantity: number;
}

export interface Cart {
  userId: number;
  items: CartItem[];
}

export interface CartItemView {
  bookId: number;
  quantity: number;

  id: number;
  title: string;
  author: string;
  price: number;
  image: string;
}