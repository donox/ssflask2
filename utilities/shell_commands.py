import shlex
import logging
import subprocess

# TODO:  Add logging support back in
# def run_shell_command(command_line, logger, outfile=False):
def run_shell_command(command_line, outfile=False):
    command_line_args = shlex.split(command_line)
    cmd = command_line_args[0]

    # logger.make_info_entry('Subprocess: {}'.format(command_line))

    try:
        command_line_process = subprocess.Popen(
            command_line_args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )

        process_output, process_error = command_line_process.communicate()
        status = subprocess.getstatusoutput(cmd)
        if outfile:
            with open(outfile, 'wb') as fl:
                fl.write(process_output)

        # logger.make_info_entry(process_output)
        # logger.make_info_entry(process_error)
    except (OSError, subprocess.CalledProcessError) as exception:
        # logger.make_error_entry('Exception occurred in {}: {}'.format(cmd, exception))
        # logger.make_error_entry('Subprocess {} failed'.format(cmd))
        return False
    else:
        # no exception was raised
        # logger.make_info_entry('Subprocess {} completed'.format(cmd))
        pass
    return True


