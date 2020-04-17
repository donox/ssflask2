from db_mgt.event_tables import Event, EventTime, EventMeta
from db_mgt.db_exec import DBExec
from werkzeug.utils import secure_filename
from .event_retrieval_support import SelectedEvents, Evt
from .event_operations import CsvToDb, JSONToDb, calendar_categories, calendar_audiences
import tempfile
from flask import send_file
from io import BytesIO
from utilities.sst_exceptions import log_sst_error
import sys
from ssfl.admin.forms.manage_calendar_form import ManageCalendarForm

ALLOWED_EXTENSIONS = set(['csv', 'json'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def manage_calendar(db_exec: DBExec, form: ManageCalendarForm):
    """Process calendar form as requested."""
    """
     Route: '/admin/calendar' => manage_calendar
     Template: calendar.jinja2
     Form: manage_calendar_form.py
     Processor: manage_calendar.py
    """
    work_function = form.work_function
    input_file = form.file_name.data
    audiences = form.audiences.data
    categories = form.categories.data
    cal_start = form.start_datetime
    cal_end = form.end_datetime
    out_file = form.save_file_name.data
    submit = form.submit.data

    calendar_mgr = db_exec.create_event_manager()
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
                    build_calendar = CsvToDb(db_exec,  file_content)
                    build_calendar.add_events()
                    for evt in build_calendar.get_event_list():
                        calendar_mgr.add_event_to_database(evt, commit=True)
            return True

        elif work_function.data == 'c_json':
            # Upload calendar from JSON
            if not ('.' in input_file.filename and input_file.filename.rsplit('.', 1)[1].lower() == 'json'):
                form.errors['file_name'].append(f'Input file: {input_file} not a valid calendar file.')
                return False
            else:
                secure_filename(input_file.filename)
                with tempfile.TemporaryFile(mode='w+b') as file_path:
                    input_file.save(file_path)
                    file_path.seek(0)
                    file_content = file_path.read().decode(encoding='utf-8-sig')
                    build_calendar = JSONToDb(db_exec, file_content)
                    build_calendar.add_events()
                    for evt in build_calendar.get_event_list():
                        try:
                            calendar_mgr.add_event_to_database(evt, commit=True)
                        except Exception as e:
                            log_sst_error(sys.exc_info(), get_traceback=True)
            return True


        elif work_function.data == 'c_pr':
            # Print Calendar to file
            if not audiences:
                form.errors['No Audience'] = ['No audiences specified => no events selectable']
                return False
            if not categories:
                form.errors['No Category'] = ['No category specified => no events selectable']
                return False
            ev = SelectedEvents(db_exec, cal_start, cal_end, audiences, categories)
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
            # return False
            calendar_mgr.reset_calendar()
            return True

        elif work_function.data == 'c_del':
            try:
                if not audiences:
                    form.errors['No Audience'] = ['No audiences specified => no events selectable']
                    return False
                if not categories:
                    form.errors['No Category'] = ['No category specified => no events selectable']
                    return False
                ev = SelectedEvents(db_exec, cal_start, cal_end, audiences, categories)
                events = ev.get_events()
                for event in events:
                    calendar_mgr.delete_specific_event(event, cal_start.data, cal_end.data)
            except Exception as e:
                log_sst_error(sys.exc_info(), get_traceback=True)
                form.errors['Exception'] = [f'Error deleting event: {e.args}']
                return False
            return True
    except Exception as e:
        log_sst_error(sys.exc_info(), get_traceback=True)
        form.errors['Exception'] = ['Exception occurred processing page']
        return False

