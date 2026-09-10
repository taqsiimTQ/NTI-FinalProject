import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { CartItemView } from '../core/models/cart.model';

@Component({
  selector: 'tr[app-cart-item-row]',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './cart-item-row.html',
  styleUrl: './cart-item-row.css',
  host: {
    class: 'cart-row',
    '[class.low-qty]': 'item.quantity <= 1',
  },
})
export class CartItemRow implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) item!: CartItemView;

  @Output() increase = new EventEmitter<void>();
  @Output() decrease = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
  @Output() qtyChange = new EventEmitter<number>();

  ngOnInit(): void {
    console.log(
      `[CartItemRow] ngOnInit → "${this.item.title}" added to the table`,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      console.log(
        `[CartItemRow] ngOnChanges → "${this.item.title}" updated (qty=${this.item.quantity})`,
      );
    }
  }

  ngOnDestroy(): void {
    console.log(
      `[CartItemRow] ngOnDestroy → "${this.item.title}" removed from the table`,
    );
  }

  onQtyInput(value: number): void {
    this.qtyChange.emit(value);
  }
}