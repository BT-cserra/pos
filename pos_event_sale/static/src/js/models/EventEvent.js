/*
Copyright 2021 Camptocamp (https://www.camptocamp.com).
@author Iván Todorovich <ivan.todorovich@camptocamp.com>
License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
*/
odoo.define("pos_event_sale.EventEvent", function (require) {
    "use strict";

    const { getDatesInRange } = require("pos_event_sale.utils");
    // const { PosGlobalState } = require('point_of_sale.models');
    const Registries = require('point_of_sale.Registries');
    const { Order } = require('point_of_sale.models');
    const PosModel = Object.getPrototypeOf(Order)

    class EventEvent extends PosModel{

        constructor(obj, options) {
            super(obj);
            this.db = options.db;
            Object.assign(this,  obj);
        }

        getEventTickets() {
            return this.db.getEventTicketsByEventID(this.id);
        }

        /**
         * Computes the total ordered quantity for this event.
         *
         * @param {Order} options.order defaults to the current order
         * @returns {Number} ordered quantity
         */
        getOrderedQuantity({order} = {}) {
            order = order ? order : this.env.pos.get_order();
            if (!order) {
                return 0;
            }
            return order
                .get_orderlines()
                .filter((line) => line.getEvent() === this)
                .reduce((sum, line) => sum + line.quantity, 0);
        }

        /**
         * Computes the available places, considering all the ordered quantities in
         * the current order.
         *
         * Please note it doesn't check the available seats against the backend.
         * For a real availability check see updateAndCheckEventAvailability.
         *
         * @param {Object} options - Sent to getOrderedQuantity
         * @returns {Number} available seats
         */
        getSeatsAvailable(options) {
            return this.seats_limited
                ? this.seats_available - this.getOrderedQuantity(options)
                : this.seats_available;
        }

        getTicketSeatsAvailable(options) {
            return this.getEventTickets()
                .map((ticket) => ticket.getSeatsAvailable(options))
                .reduce((sum, qty) => sum + qty, 0);
        }

        /**
         * Similar to getSeatsAvailable, but also checks its ticket's availability.
         * It's useful to display the real availability in the UI, that accounts for
         * both the event and the tickets availability.
         *
         * @param {Object} options - Sent to getOrderedQuantity
         * @returns {Number} available seats
         */
        getSeatsAvailableReal(options) {
            const ticketSeatsAvailable = this.getTicketSeatsAvailable(options);
            const eventSeatsAvailable = this.getSeatsAvailable(options);
            return Math.min(ticketSeatsAvailable, eventSeatsAvailable);
        }

        /**
         * @returns {[Date]} List of Dates for which this event is available
         */
        getEventDates() {
            return getDatesInRange(this.date_begin, this.date_end);
        }
    }

    Registries.Model.add(EventEvent);
    return EventEvent;
});
