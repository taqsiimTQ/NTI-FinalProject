import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Book } from '../../core/models/book.model';
import { BookService } from '../../core/services/book.service';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './books.html',
  styleUrl: './books.css',
})
export class Books implements OnInit {
  books: Book[] = [];

  constructor(
    private bookService: BookService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.bookService.getBooks().subscribe({
      next: (books) => {
        this.books = books;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading books:', error);
      },
    });
  }
}
