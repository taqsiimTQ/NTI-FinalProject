import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cart, CartItemView } from '../models/cart.model';
import { Book } from '../models/book.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly currentUserId = 3;

  private readonly cart = signal<Cart>({
    userId: this.currentUserId,
    items: [],
  });

  private readonly books = signal<Book[]>([]);

  readonly items = computed<CartItemView[]>(() => {
    const cart = this.cart();
    const books = this.books();

    return cart.items
      .map((cartItem) => {
        const book = books.find(
          (book) => book.id === cartItem.bookId
        );

        if (!book) {
          return null;
        }

        return {
          bookId: cartItem.bookId,
          quantity: cartItem.quantity,

          id: book.id,
          title: book.title,
          author: book.author,
          price: book.price,
          image: book.image,
        };
      })
      .filter(
        (item): item is CartItemView => item !== null
      );
  });

  readonly subtotal = computed(() =>
    this.items().reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  readonly freeShippingThreshold = 1000;

  readonly shipping = computed(() =>
    this.subtotal() >= this.freeShippingThreshold ? 0 : 50
  );

  readonly total = computed(
    () => this.subtotal() + this.shipping()
  );

  constructor(private readonly http: HttpClient) {
    this.loadCart();
    this.loadBooks();
  }

  private loadCart(): void {
    this.http
      .get<Cart[]>('Assets/data/cart.json')
      .subscribe({
        next: (carts) => {
          const userCart = carts.find(
            (cart) => cart.userId === this.currentUserId
          );

          if (userCart) {
            this.cart.set(userCart);
            console.log('User cart loaded:', userCart);
          } else {
            console.warn(
              `No cart found for user ${this.currentUserId}`
            );
          }
        },

        error: (error) => {
          console.error(
            'Failed to load cart.json:',
            error
          );
        },
      });
  }

  private loadBooks(): void {
    this.http
      .get<Book[]>('Assets/data/books.json')
      .subscribe({
        next: (books) => {
          this.books.set(books);
          console.log('Books loaded:', books);
        },

        error: (error) => {
          console.error(
            'Failed to load books.json:',
            error
          );
        },
      });
  }

  increase(bookId: number): void {
    this.cart.update((cart) => ({
      ...cart,

      items: cart.items.map((item) =>
        item.bookId === bookId
          ? {
            ...item,
            quantity: item.quantity + 1,
          }
          : item
      ),
    }));
  }

  decrease(bookId: number): void {
    this.cart.update((cart) => ({
      ...cart,

      items: cart.items.map((item) =>
        item.bookId === bookId && item.quantity > 1
          ? {
            ...item,
            quantity: item.quantity - 1,
          }
          : item
      ),
    }));
  }

  updateQty(
    bookId: number,
    quantity: number
  ): void {
    const safeQuantity = Math.max(
      1,
      Math.min(99, Math.floor(quantity))
    );

    this.cart.update((cart) => ({
      ...cart,

      items: cart.items.map((item) =>
        item.bookId === bookId
          ? {
            ...item,
            quantity: safeQuantity,
          }
          : item
      ),
    }));
  }

  remove(bookId: number): void {
    this.cart.update((cart) => ({
      ...cart,

      items: cart.items.filter(
        (item) => item.bookId !== bookId
      ),
    }));
  }
  addToCart(bookId: number, quantity: number): void {
    this.cart.update((cart) => {
      const existingItem = cart.items.find(
        (item) => item.bookId === bookId
      );

      if (existingItem) {
        return {
          ...cart,
          items: cart.items.map((item) =>
            item.bookId === bookId
              ? {
                ...item,
                quantity: item.quantity + quantity,
              }
              : item
          ),
        };
      }

      return {
        ...cart,
        items: [
          ...cart.items,
          {
            bookId,
            quantity,
          },
        ],
      };
    });
  }

  clear(): void {
    this.cart.update((cart) => ({
      ...cart,
      items: [],
    }));
  }
}