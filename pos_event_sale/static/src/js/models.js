/*
    Copyright 2021 Camptocamp (https://www.camptocamp.com).
    @author Iván Todorovich <ivan.todorovich@camptocamp.com>
    License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
*/
odoo.define("pos_event_sale.models", function (require) {
    "use strict";

    const EventEvent = require('pos_event_sale.EventEvent');
    const EventTicket = require('pos_event_sale.EventTicket');
    const { PosGlobalState } = require('point_of_sale.models');
    const Registries = require('point_of_sale.Registries');

    const PosEventSalePosGlobalState = (PosGlobalState) =>
        class PosEventSalePosGlobalState extends PosGlobalState {

            constructor() {
                super(...arguments);
            }

            async _processData(loadedData) {
                await super._processData(...arguments);
                if (this.config.iface_event_sale) {
                    await this._load_events(loadedData['event.event']);
                    await this._load_event_tickets(loadedData['event.event.ticket']);
                    await this._load_event_tag_categories(loadedData['event.tag.category']);
                    await this._load_event_tags(loadedData['event.tag']);
                }
            }

            async _load_events(events) {
                this.db.addEvents(
                    events.map((event) => {
                        event.pos = this;
                        return EventEvent.create(event, {
                            "db": this.db,
                            "env": this.env,
                        });
                    })
                );
            }

            async _load_event_tickets (tickets) {
                this.db.addEventTickets(
                    tickets.map((ticket) => {
                        ticket.pos = this;
                        return EventTicket.create(ticket, {
                            "db": this.db,
                            "env": this.env,
                        });
                    })
                );
            }

            async _load_event_tag_categories (records) {
                this.db.event_tag_category_by_id = {};
                this.db.event_tags = records;
                for (const record of records) {
                    record.tag_ids = [];
                    this.db.event_tag_category_by_id[record.id] = record;
                }
            }

            async _load_event_tags(tags) {
                for (const tag of tags) {
                    const category =
                        this.db.event_tag_category_by_id[tag.category_id[0]];
                    if (category) {
                        category.tag_ids.push(tag);
                    }
                }
            }
        }

        Registries.Model.extend(PosGlobalState, PosEventSalePosGlobalState);
});
