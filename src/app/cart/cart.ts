import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/book.model';
import { CartItemRow } from '../cart-item-row/cart-item-row';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe, CartItemRow],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit, OnDestroy {
  readonly items: CartService['items'];
  readonly subtotal: CartService['subtotal'];
  readonly shipping: CartService['shipping'];
  readonly total: CartService['total'];
  readonly freeShippingThreshold: number;

  constructor(private readonly cartService: CartService) {
    this.items = this.cartService.items;
    this.subtotal = this.cartService.subtotal;
    this.shipping = this.cartService.shipping;
    this.total = this.cartService.total;
    this.freeShippingThreshold = this.cartService.freeShippingThreshold;
  }

  ngOnInit(): void {
    console.log('[Cart] ngOnInit → cart page loaded, data read from CartService');
  }

  ngOnDestroy(): void {
    console.log('[Cart] ngOnDestroy → user left the cart page');
  }

  onIncrease(item: CartItem): void {
    this.cartService.increase(item.id);
  }

  onDecrease(item: CartItem): void {
    this.cartService.decrease(item.id);
  }

  onRemove(item: CartItem): void {
    this.cartService.remove(item.id);
  }

  onQtyChange(item: CartItem, qty: number): void {
    this.cartService.updateQty(item.id, qty);
  }
}
