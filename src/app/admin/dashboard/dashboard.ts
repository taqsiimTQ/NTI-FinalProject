import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { Book } from '../../core/models/book.model';
import { Order } from '../../core/models/order.model';

import { BookService } from '../../core/services/book.service';
import { OrderService } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  books: Book[] = [];
  orders: Order[] = [];

  totalBooks = 0;
  totalUsers = 0;
  totalOrders = 0;
  totalSales = 0;

  salesByMonth: {
    month: string;
    sales: number;
  }[] = [];

  topBooks: {
    title: string;
    quantity: number;
  }[] = [];

  maxSales = 0;




  constructor(
    private bookService: BookService,
    private orderService: OrderService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadBooks();
    this.loadUsers();
    this.loadOrders();
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe({
      next: (books) => {
        this.books = books;
        this.totalBooks = books.length;

        this.calculateTopBooks();

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.log('Error loading books:', error);

        this.cdr.detectChanges();
      }
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.totalUsers = users.length;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.log('Error loading users:', error);

        this.cdr.detectChanges();
      }
    });
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;

        this.totalOrders = orders.length;

        this.calculateTotalSales();
        this.calculateMonthlySales();
        this.calculateTopBooks();

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.log('Error loading orders:', error);

        this.cdr.detectChanges();
      }
    });
  }

  calculateTotalSales(): void {
    this.totalSales = 0;

    for (const order of this.orders) {
      this.totalSales += order.total;
    }
  }

  calculateMonthlySales(): void {
    const monthlySales: { [month: string]: number } = {};

    for (const order of this.orders) {
      const date = new Date(order.date);

      if (isNaN(date.getTime())) {
        continue;
      }

      const month = date.toLocaleString('en-US', {
        month: 'short'
      });

      if (monthlySales[month]) {
        monthlySales[month] += order.total;
      } else {
        monthlySales[month] = order.total;
      }
    }

    this.salesByMonth = [];

    for (const month in monthlySales) {
      this.salesByMonth.push({
        month: month,
        sales: monthlySales[month]
      });
    }

    this.maxSales = 0;

    for (const item of this.salesByMonth) {
      if (item.sales > this.maxSales) {
        this.maxSales = item.sales;
      }
    }
  }

  calculateTopBooks(): void {
    const bookSales: { [id: number]: number } = {};

    for (const order of this.orders) {
      for (const item of order.items) {
        if (bookSales[item.bookId]) {
          bookSales[item.bookId] += item.quantity;
        } else {
          bookSales[item.bookId] = item.quantity;
        }
      }
    }

    this.topBooks = [];

    for (const id in bookSales) {
      const book = this.books.find(
        b => b.id === Number(id)
      );

      this.topBooks.push({
        title: book
          ? book.title
          : `Book #${id}`,

        quantity: bookSales[Number(id)]
      });
    }

    this.topBooks.sort(
      (a, b) => b.quantity - a.quantity
    );

    this.topBooks = this.topBooks.slice(0, 5);


  }

  getBarHeight(sales: number): number {
    if (this.maxSales === 0) {
      return 0;
    }

    return (sales / this.maxSales) * 100;
  }
}