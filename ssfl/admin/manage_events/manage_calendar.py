from db_mgt.event_tables import Event, EventTime, EventMeta
from werkzeug.utils import secure_filename
from .event_retrieval_support import SelectedEvents, Evt
from .event_operations import CsvToDb, JSONToDb, calendar_categories, calendar_audiences
import tempfile
from flask import send_file
from io import BytesIO
from utilities.sst_exceptions import log_sst_error
import sys

ALLOWED_EXTENSIONS = set(['csv', 'json'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def manage_calendar(db_session, form):
    """Process calendar form as requested."""
    work_function = form.work_function
    input_file = form.file_name.data
    audiences = form.audiences.data
    categories = form.categories.data
    cal_start = form.start_datetime
    cal_end = form.end_datetime
    out_file = form.save_file_name.data
    submit = form.submit.data
    try:
        if work_function.data == 'XXX':
            pass

        elif work_function.data == 'c_csv':
            # Upload calendar from csv file
            if not('.' in input_file.filename and input_file.filename.rsplit('.', 1)[1].lower() == 'csv'):
                form.errors['file_name'].append(f'Input file: {input_file} not a valid calendar file.')
                return False
            else:
                secure_filename(input_file.filename)
                with tempfile.TemporaryFile(mode='w+b') as file_path:
                    # file_path = tempfile.TemporaryFile()
                    input_file.save(file_path)
                    file_path.seek(0)
                    file_content = file_path.read().decode(encoding='latin-1')
                    build_calendar = CsvToDb(file_content)
                    build_calendar.add_events()
                    for evt in build_calendar.get_event_list():
                        evt.add_to_db(db_session)
            return True

        elif work_function.data == 'c_json':
            # Upload calendar from JSON
            if not ('.' in input_file.filename and input_file.filename.rsplit('.', 1)[1].lower() == 'json'):
                form.errors['file_name'].append(f'Input file: {input_file} not a valid calendar file.')
                return False
            else:
                secure_filename(input_file.filename)
                with tempfile.TemporaryFile(mode='w+b') as file_path:
                    # file_path = tempfile.TemporaryFile()
                    input_file.save(file_path)
                    file_path.seek(0)
                    file_content = file_path.read().decode(encoding='latin-1')
                    build_calendar = JSONToDb(file_content)
                    build_calendar.add_events()
                    for evt in build_calendar.get_event_list():
                        try:
                            evt.add_to_db(db_session)
                        except Exception as e:
                            log_sst_error(sys.exc_info(), get_traceback=True)
            return True


        elif work_function.data == 'c_pr':
            # Print Calendar to file
            ev = SelectedEvents(db_session, cal_start, cal_end, audiences, categories)
            events = ev.get_events()
            with tempfile.TemporaryFile(mode='w+b') as fl:
                s = f'No events - {len(events)} : Start - {ev.start} : End - {ev.end}\n'
                s += f'   Audiences -  {ev.audiences} : Categories -  {ev.categories}\n\n'
                fl.write(s.encode('utf-8'))
                for event in events:
                    s = f'{event.id} : {event.event_name} : {event.event_location}\n'
                    s += f'{event.id} :    : {event.event_start} : {event.event_end} : {event.all_day}\n'
                    s += f'{event.id} :    : {event.event_audiences} : {event.event_categories} \n'
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
                    s += f'{event.id} :    : {p_cost} : {p_ec_pickup} : {p_hl_pickup}\n\n'
                    fl.write(s.encode('utf-8'))
                fl.seek(0)
                return send_file(BytesIO(fl.read()),  mimetype="text/plain", as_attachment=True,
                                 attachment_filename=out_file + '.txt')

        elif work_function.data == 'c_new':
            # Clear all event tables and reinitialize Event_Meta
            form.errors['Exception'] = ['Calendar clearing not yet tested']
            return False
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
            return True

        elif work_function.data == 'c_del':
            try:
                ev = SelectedEvents(db_session, cal_start, cal_end, audiences, categories)
                events = ev.get_events()
                for event in events:
                    event.delete_specific_event(db_session, cal_start.data, cal_end.data)
            except Exception as e:
                log_sst_error(sys.exc_info(), get_traceback=True)
                form.errors['Exception'] = [f'Error deleting event: {e.args}']
                return False
            return True
    except Exception as e:
        log_sst_error(sys.exc_info(), get_traceback=True)
        form.errors['Exception'] = ['Exception occurred processing page']
        return False

