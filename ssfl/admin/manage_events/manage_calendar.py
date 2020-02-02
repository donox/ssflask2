from db_mgt.event_tables import Event, EventTime, EventMeta
from utilities.sst_exceptions import DataEditingSystemError
from wtforms import ValidationError
from .event_retrieval_support import EventsInPeriod, Evt
from .event_operations import CsvToDb, calendar_categories, calendar_audiences


def manage_calendar(db_session, form):
    """Process calendar form as requested."""
    audiences = form.audiences.data
    categories = form.categories.data
    work_function = form.work_function
    cal_start = form.start_datetime
    cal_end = form.end_datetime
    direct = form.directory.data
    file = form.file_name.data
    submit = form.submit.data
    try:
        if work_function.data == 'pc':
            # Print Calendar to file
            ev = EventsInPeriod(db_session, cal_start, cal_end, audiences, categories)
            events = ev.get_events()
            with open(direct + '/' + file, 'w') as fl:
                s = f'{len(events)} : {ev.start} : {ev.end} : {ev.audiences} : {ev.categories}\n'
                fl.write(s)
                for event in events:
                    s = f'{event.id} : {event.event_name} : {event.event_location}\n'
                    fl.write(s)
                    s = f'{event.id} :       : {event.event_start} : {event.event_end} : {event.all_day}\n'
                    fl.write(s)
                    s = f'{event.id} :       : {event.event_audiences} : {event.event_categories} \n'
                    fl.write(s)
                    if hasattr(event, 'cost'):
                        p_cost = event.cost
                    else:
                        p_cost = 'No Cost given'
                    if hasattr(event, 'ec_pickup'):
                        p_ec_pickup = event.ec_pickup
                    else:
                        p_ec_pickup = 'No ec_pickup given'
                    if hasattr(event, 'hl_pickup'):
                        p_hl_pickup = event.hl_pickup
                    else:
                        p_hl_pickup = 'No hl_pickup given'
                    s = f'{event.id} :       : {p_cost} : {p_ec_pickup} : {p_hl_pickup}\n'
                    fl.write(s)
            fl.close()
        elif work_function.data == 'uc':
            build_calendar = CsvToDb(direct + '/' + file)
            build_calendar.add_events()
            for evt in build_calendar.get_event_list():
                evt.add_to_db(db_session)
        elif work_function.data == 'init':
            # Clear all event tables and reinitialize Event_Meta
            db_session.query(EventTime).delete()
            db_session.query(Event).delete()
            db_session.query(EventMeta).delete()
            db_session.commit()
            for aud in calendar_audiences:
                evm = EventMeta(meta_key='audience', meta_value=aud)
                evm.add_to_db(db_session, commit=True)
            for cat in calendar_categories:
                evm = EventMeta(meta_key='category', meta_value=cat.lower())
                evm.add_to_db(db_session, commit=True)
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['Exception'] = ['Exception occurred processing page']
        return False

