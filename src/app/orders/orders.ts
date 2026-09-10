import { HttpClient } from '@angular/common/http';    
import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../auth/core/auth.service';
import { Book } from '../core/models/book.model';
import { Order } from '../core/models/order.model';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
  profileImage?: string;
}

interface OrderWithDetails extends Order {
  customer?: User;
  books?: Book[];
}

@Component({
  selector: 'app-orders',
  imports: [RouterLink, CurrencyPipe, DecimalPipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  private readonly http = inject(HttpClient);
  readonly authService = inject(AuthService);

  readonly currentUser = this.authService.user;

  readonly orders = signal<OrderWithDetails[]>([]);
  readonly selectedOrder = signal<OrderWithDetails | null>(null);
  readonly loading = signal(true);

  readonly books = signal<Book[]>([]);
  readonly users = signal<User[]>([]);

  readonly isAdmin = signal(false);

  constructor() {
    this.isAdmin.set(this.currentUser()?.role === 'admin');
    this.loadOrdersData();
  }

  private loadOrdersData(): void {
    this.loading.set(true);

    forkJoin({
      orders: this.http.get<Order[]>('Assets/data/orders.json').pipe(catchError(() => of([] as Order[]))),

      books: this.http.get<Book[]>('Assets/data/books.json').pipe(catchError(() => of([] as Book[]))),

      users: this.http.get<User[]>('Assets/data/users.json').pipe(catchError(() => of([] as User[]))),})
      .subscribe(({ orders, books, users }) => {
      this.books.set(books);
      this.users.set(users);

      const userId = this.currentUser()?.id;

      const visibleOrders = this.isAdmin()? 
      orders.filter((order) => {
            const customer = users.find((user) => user.id === order.userId);
            return customer?.role !== 'admin';
      }): 
      orders.filter((order) => order.userId === userId);

      const ordersWithDetails = visibleOrders.map((order) => ({...order,
          customer: users.find((user) => user.id === order.userId),
          books: order.items.map((item) => books.find((book) => book.id === item.bookId)).filter((book): book is Book => !!book),
        })).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

      this.orders.set(ordersWithDetails);

      if (ordersWithDetails.length > 0) {
        this.selectedOrder.set(ordersWithDetails[0]);
      }

      this.loading.set(false);
    });
  }

  selectOrder(order: OrderWithDetails): void {
    this.selectedOrder.set(order);
  }

  getBookTitle(bookId: number): string {
    return (
      this.books().find((book) => book.id === bookId)?.title ??
      'Unknown book'
    );
  }

  getBookImage(bookId: number): string {
    return (
      this.books().find((book) => book.id === bookId)?.image ??
      ''
    );
  }

  getCustomerName(order: OrderWithDetails): string {
    if (!order.customer) {
      return 'Unknown customer';
    }

    return (
      `${order.customer.firstName} ${order.customer.lastName}`.trim() ||
      order.customer.username
    );
  }

  getTotalItems(order: Order): number {
    return order.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );
  }

  getTotalOrders(): number {
    return this.orders().length;
  }

  getTotalSales(): number {
    return this.orders().reduce(
      (total, order) => total + order.total,
      0,
    );
  }

  getCustomerCount(): number {
    return new Set(
      this.orders().map((order) => order.userId),
    ).size;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}