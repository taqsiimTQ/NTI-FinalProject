import { HttpClient } from '@angular/common/http';
import {
  Component,
  effect,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../auth/core/auth.service';
import { Book } from '../core/models/book.model';
import { Order } from '../core/models/order.model';
import { WishlistService } from '../services/wishlist.service';

interface ProfileStats {
  first: number;
  second: number;
  third: number;
}

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {

  private readonly http = inject(HttpClient);

  readonly authService = inject(AuthService);

  private readonly wishlistService =
    inject(WishlistService);

  readonly currentUser =
    this.authService.user;

  readonly books =
    signal<Book[]>([]);

  readonly stats =
    signal<ProfileStats>({
      first: 0,
      second: 0,
      third: 0
    });

  readonly featuredBooks =
    signal<Book[]>([]);

  readonly editing =
    signal(false);

  readonly saveMessage =
    signal('');

  draft = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: ''
  };

  constructor() {

    this.resetDraft();
    this.wishlistService.loadWishlist();
    this.loadProfileActivity();
    effect(() => {

      const user = this.currentUser();

      if (!user) {
        return;
      }

      if (user.role === 'admin') {
        return;
      }

      const wishlist =
        this.wishlistService.wishlist();

      const userWishlist =
        wishlist.find(
          entry =>
            entry.userId === user.id
        );

      const bookIds =
        userWishlist?.bookIds ?? [];

        this.stats.update(stats => ({
        ...stats,
        third: bookIds.length
      }));

      const wishlistBooks =
        this.books()
          .filter(book =>
            bookIds.includes(book.id)
          )
          .slice(0, 6);

      this.featuredBooks.set(
        wishlistBooks
      );

    });
  }

  get fullName(): string {

    const user =
      this.currentUser();

    if (!user) {
      return 'BookNest reader';
    }

    const name =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`
        .trim();

    return name ||
      user.username ||
      'BookNest reader';
  }

  get initials(): string {

    const user =
      this.currentUser();

    if (!user) {
      return '';
    }

    return (
      `${user.firstName?.[0] ?? ''}` +
      `${user.lastName?.[0] ?? ''}`
    ).toUpperCase();
  }

  get isAdmin(): boolean {

    return this.currentUser()?.role === 'admin';
  }

  get statLabels(): [string, string, string] {

    if (this.isAdmin) {

      return [
        'Total books',
        'Total orders',
        'Users'
      ];

    }

    return [
      'Books in orders',
      'Total orders',
      'Wishlist'
    ];
  }

  startEditing(): void {

    this.resetDraft();

    this.saveMessage.set('');

    this.editing.set(true);
  }

  cancelEditing(): void {

    this.resetDraft();

    this.editing.set(false);

    this.saveMessage.set('');
  }

  saveProfile(): void {

    if (
      !this.draft.firstName.trim() ||
      !this.draft.username.trim() ||
      !this.draft.email.trim()
    ) {

      this.saveMessage.set(
        'First name, username, and email are required.'
      );

      return;
    }

    const updatedUser =
      this.authService.updateProfile({

        firstName:
          this.draft.firstName.trim(),

        lastName:
          this.draft.lastName.trim(),

        username:
          this.draft.username.trim(),

        email:
          this.draft.email.trim(),

        phone:
          this.draft.phone.trim(),

        address:
          this.draft.street.trim() ||
          this.draft.city.trim() ||
          this.draft.state.trim() ||
          this.draft.country.trim()
            ? {

                street:
                  this.draft.street.trim(),

                city:
                  this.draft.city.trim(),

                state:
                  this.draft.state.trim(),

                country:
                  this.draft.country.trim()

              }
            : undefined
      });

    if (updatedUser) {

      this.editing.set(false);

      this.saveMessage.set(
        'Profile updated successfully.'
      );

    }
  }

  private resetDraft(): void {

    const user =
      this.currentUser();

    if (!user) {
      return;
    }

    this.draft = {

      firstName:
        user.firstName ?? '',

      lastName:
        user.lastName ?? '',

      username:
        user.username ?? '',

      email:
        user.email ?? '',

      phone:
        user.phone ?? '',

      street:
        user.address?.street ?? '',

      city:
        user.address?.city ?? '',

      state:
        user.address?.state ?? '',

      country:
        user.address?.country ?? ''
    };
  }


  private loadProfileActivity(): void {

    forkJoin({

      books:
        this.http
          .get<Book[]>(
            'Assets/data/books.json'
          )
          .pipe(
            catchError(() =>
              of([] as Book[])
            )
          ),

      orders:
        this.http
          .get<Order[]>(
            'Assets/data/orders.json'
          )
          .pipe(
            catchError(() =>
              of([] as Order[])
            )
          )

    }).subscribe({

      next: ({ books, orders }) => {

        this.books.set(books);

        this.loadActivity(
          books,
          orders
        );

      },

      error: error => {

        console.error(
          'Error loading profile data:',
          error
        );

      }

    });
  }


  private loadActivity(
    books: Book[],
    orders: Order[]
  ): void {

    const user =
      this.currentUser();

    if (!user) {
      return;
    }


    if (user.role === 'admin') {

      this.http
        .get<any[]>(
          'Assets/data/users.json'
        )
        .pipe(
          catchError(() =>
            of([])
          )
        )
        .subscribe({

          next: users => {

            this.stats.set({

              first:
                books.length,

              second:
                orders.length,

              third:
                users.length

            });

            this.featuredBooks.set(
              books.slice(0, 6)
            );

          },

          error: error => {

            console.error(
              'Error loading users:',
              error
            );

          }

        });

      return;
    }


    const userOrders =
      orders.filter(
        order =>
          order.userId === user.id
      );

    const booksInOrders =
      userOrders.reduce(
        (total, order) => {

          return (
            total +
            order.items.reduce(
              (sum, item) =>
                sum + item.quantity,
              0
            )
          );

        },
        0
      );

    const orderCount =
      userOrders.length;

    const wishlistBookIds =
      this.wishlistService.getUserBookIds(
        user.id
      );

    this.stats.set({

      first:
        booksInOrders,

      second:
        orderCount,

      third:
        wishlistBookIds.length

    });

    this.featuredBooks.set(

      books
        .filter(book =>
          wishlistBookIds.includes(book.id)
        )
        .slice(0, 6)

    );
  }
}