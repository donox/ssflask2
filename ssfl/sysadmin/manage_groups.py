import os
from db_mgt.db_exec import DBExec
from db_mgt.page_tables import Page, PageManager
from db_mgt.group_tables import Group, GroupMembers, GroupTableManager
from utilities.miscellaneous import get_temp_file_name, extract_fields_to_dict
import csv
from lxml import etree, html
import lxml
from flask import send_file, render_template
from utilities.sst_exceptions import SsTSystemError
from datetime import datetime as dt


def manage_group_functions(db_exec: DBExec, form):
    """Functions to manage groups."""
    """
     Route: '/sysadmin/manage_groups' => manage_groups
     Template: manage_groups.jinja2
     Form: manage_groups_form.py
     Processor: manage_groups.py
    """
    function_to_execute = form.work_function.data
    group_name = form.group_name.data
    owner = form.group_owner.data
    purpose = form.group_purpose.data
    member_name = form.member_name.data
    result_template = 'sysadmin/display_group_and_members.jinja2'
    #   gr_cg gr_del gr_am gr_rm gr_lg gr_lm
    try:
        group_mgr = db_exec.create_group_manager()
        user_mgr = db_exec.create_user_manager()
        if function_to_execute == 'gr_cg':  # 'Create New Group'
            if group_mgr.get_group_id_from_name(group_name):
                form.errors['group_name'] = [f'A group named {group_name} already exists']
                return False
            owner_id = user_mgr.get_user_id_from_name(owner)
            group = Group(owner=owner_id, group_name=group_name, group_purpose=purpose, status='active')
            group_mgr.create_group(group)
            group_mgr.add_member_to_group(group.id, owner_id)
            return True
        elif function_to_execute == 'gr_del':  # Delete Existing Group
            group_id = group_mgr.get_group_id_from_name(group_name)
            if not group_id:
                form.errors['group_name'] = ['Group Does Not Exist']
                return False
            group_mgr.remove_group(group_id)
            return True
        elif function_to_execute == 'gr_am':  # Add Member to an existing group
            group_id = group_mgr.get_group_id_from_name(group_name)
            if not group_id:
                form.errors['group_name'] = ['Group Does Not Exist']
                return False
            member_id = user_mgr.get_user_id_from_name(member_name)
            if not member_id:
                form.errors['member_name'] = [f'Member: {member_name} not found']
                return False
            res = group_mgr.add_member_to_group(group_id, member_id)
            if not res:
                form.errors['Already There'] = [f'{member_name} is already a member of {group_name}']
            return res
        elif function_to_execute == 'gr_rm':            # Remove member from an existing group
            group_id = group_mgr.get_group_id_from_name(group_name)
            if not group_id:
                form.errors['group_name'] = ['Group Does Not Exist']
                return False
            member_id = user_mgr.get_user_id_from_name(member_name)
            if not member_id:
                form.errors['member_name'] = [f'Member: {member_name} not found']
                return False
            res = group_mgr.remove_member_from_group(group_id, member_id)
            if not res:
                raise SsTSystemError(f'Database did not find member or group after prior check for existence')
            return True
        elif function_to_execute == 'gr_lg':  # List Groups - simple web page for now
            groups = group_mgr.get_all_groups()
            group_fields = group_mgr.get_table_fields('sstgroup')
            res_groups = []
            for a_group in groups:
                members = group_mgr.get_group_members(db_exec, a_group.id)
                dct = extract_fields_to_dict(a_group, group_fields)
                owner_id = dct['owner']
                dct['owner'] = user_mgr.get_user_name_from_id(owner_id)
                dct['nbr_members'] = len(members)
                dct['created'] = dct['created'].strftime('%m/%d/%Y')
                res_groups.append(dct)
            context = {'function': 'gr_lg',
                       'fields': ['id', 'group name', 'owner', 'group purpose', 'status', 'created', 'nbr of members'],
                       'values': res_groups}
            result = render_template(result_template, **context)
            return result
        elif function_to_execute == 'gr_lm':  # List Members - simple web page for now
            member_fields = group_mgr.get_table_fields('sstgroup_member')
            group_id = group_mgr.get_group_id_from_name(group_name)
            members = group_mgr.get_group_members(db_exec, group_id)
            res_members = []
            for member in members:
                dct = extract_fields_to_dict(member, member_fields)
                dct['member_name'] = member.username
                res_members.append(dct)
            context = {'function': 'gr_lm',
                       'group_name': group_name,
                       'fields': ['member_name'],
                       'values': res_members}
            result = render_template(result_template, **context)
            return result
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['manage groups - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False
