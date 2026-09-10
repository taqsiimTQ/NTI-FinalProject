import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {

  users: User[] = [];

  loading = true;

  constructor(
    private userService: UserService,
    // private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;

        // this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;

        // this.cdr.detectChanges();
      },
    });
  }

  getAdminCount(): number {
    return this.users.filter(
      (user) => user.role === 'admin'
    ).length;
  }

  getUserCount(): number {
    return this.users.filter(
      (user) => user.role === 'user'
    ).length;
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }
}