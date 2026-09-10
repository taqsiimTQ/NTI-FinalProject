import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BookService } from './book.service';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export interface WishlistEntry {
  userId: number;
  bookIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private wishlistState = signal<WishlistEntry[]>([]);

  wishlist = this.wishlistState.asReadonly();

  constructor(
    private http: HttpClient,
    private bookService: BookService
  ) {}

  loadWishlist(): void {
    this.http
      .get<WishlistEntry[]>('http://localhost:3000/api/wishlist')
      .subscribe({
        next: (data: WishlistEntry[]) => {
          this.wishlistState.set(data);
        },
        error: (error: any) => {
          console.error('Error loading wishlist:', error);
        }
      });
  }

  getWishlist(): Observable<WishlistEntry[]> {
    return this.http.get<WishlistEntry[]>(
      'http://localhost:3000/api/wishlist'
    );
  }

  getWishlistBooks(userId: number): Observable<any[]> {
    return this.getWishlist().pipe(
      switchMap((wishlists: WishlistEntry[]) => {

        const userWishlist = wishlists.find(
          (wishlist: WishlistEntry) =>
            wishlist.userId === userId
        );

        const bookIds = userWishlist?.bookIds ?? [];

        return this.bookService.getBooks().pipe(
          map((books: any[]) =>
            books.filter((book: any) =>
              bookIds.includes(book.id)
            )
          )
        );
      })
    );
  }

  addToWishlist(userId: number, bookId: number) {
    return this.http
      .post<WishlistEntry>(
        'http://localhost:3000/api/wishlist',
        {
          userId,
          bookId
        }
      )
      .pipe(
        tap(() => {
          this.loadWishlist();
        })
      );
  }

  removeFromWishlist(userId: number, bookId: number) {
    return this.http
      .delete<WishlistEntry>(
        `http://localhost:3000/api/wishlist/${userId}/${bookId}`
      )
      .pipe(
        tap(() => {
          this.loadWishlist();
        })
      );
  }

  clearWishlist(userId: number) {
    return this.http
      .delete<WishlistEntry>(
        `http://localhost:3000/api/wishlist/${userId}`
      )
      .pipe(
        tap(() => {
          this.loadWishlist();
        })
      );
  }

  getUserBookIds(userId: number): number[] {
    const userWishlist =
      this.wishlistState().find(
        (wishlist: WishlistEntry) =>
          wishlist.userId === userId
      );

    return userWishlist?.bookIds ?? [];
  }

  getCount(userId: number): number {
    return this.getUserBookIds(userId).length;
  }
}