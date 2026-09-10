import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';

interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  phone: string;
}

const DRAFT_KEY = 'nile-reader-checkout-draft';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit, OnDestroy {
  readonly items: CartService['items'];
  readonly subtotal: CartService['subtotal'];
  readonly shipping: CartService['shipping'];
  readonly total: CartService['total'];

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router,
  ) {
    this.items = this.cartService.items;
    this.subtotal = this.cartService.subtotal;
    this.shipping = this.cartService.shipping;
    this.total = this.cartService.total;
  }

  shippingInfo: ShippingInfo = { fullName: '', address: '', city: '', phone: '' };

  paymentMethod: 'card' | 'cod' = 'card';
  cardNumber = '';
  cardExpiry = '';

  deliveryMethod: 'standard' | 'express' = 'standard';

  isPlacingOrder = false;
  orderPlaced = false;

  private autosaveHandle?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    console.log('[Checkout] ngOnInit');

    if (this.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        this.shippingInfo = { ...this.shippingInfo, ...JSON.parse(draft) };
      } catch {
      
      }
    }

    this.autosaveHandle = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(this.shippingInfo));
      console.log('[Checkout] autosave → shipping details saved as a draft');
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.autosaveHandle) {
      clearInterval(this.autosaveHandle);
      console.log('[Checkout] ngOnDestroy → autosave timer cleared');
    }
  }

  placeOrder(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.isPlacingOrder = true;

    setTimeout(() => {
      this.isPlacingOrder = false;
      this.orderPlaced = true;
      this.cartService.clear();
      localStorage.removeItem(DRAFT_KEY);
    }, 900);
  }
}
